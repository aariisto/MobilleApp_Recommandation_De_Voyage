import os
import time
import logging
import re
import requests
from flask import current_app

logger = logging.getLogger(__name__)


class AmadeusService:
    """Unified Amadeus service: token management + flight offers + activities search.

    Reads optional configuration from environment or `current_app.config`:
    - AMADEUS_BASE_URL
    - AMADEUS_ACCESS_TOKEN
    - AMADEUS_CLIENT_ID
    - AMADEUS_CLIENT_SECRET
    """

    TOKEN_PATH = '/v1/security/oauth2/token'

    def __init__(self, app=None):
        cfg = getattr(app, 'config', {}) if app is not None else (current_app.config if current_app else {})
        self.base_url = (os.getenv('AMADEUS_BASE_URL') or cfg.get('AMADEUS_BASE_URL') or 'https://test.api.amadeus.com').rstrip('/')
        self.access_token = os.getenv('AMADEUS_ACCESS_TOKEN') or cfg.get('AMADEUS_ACCESS_TOKEN')
        self.client_id = os.getenv('AMADEUS_CLIENT_ID') or cfg.get('AMADEUS_CLIENT_ID')
        self.client_secret = os.getenv('AMADEUS_CLIENT_SECRET') or cfg.get('AMADEUS_CLIENT_SECRET')
        self._token_expires_at = None

        if self.access_token:
            masked = f"{self.access_token[:4]}...{self.access_token[-4:]}" if len(self.access_token) > 8 else '***'
            logger.info('Amadeus token present (env/config): %s', masked)
        else:
            logger.info('No Amadeus access token in env/config; service will fetch if client credentials exist')

    def token_is_valid(self):
        if not self.access_token:
            return False
        if not self._token_expires_at:
            return True
        try:
            return float(self._token_expires_at) > time.time() + 5
        except Exception:
            return True

    def fetch_token(self, timeout=10):
        token_url = f"{self.base_url}{self.TOKEN_PATH}"
        cid = os.getenv('AMADEUS_CLIENT_ID') or self.client_id
        csec = os.getenv('AMADEUS_CLIENT_SECRET') or self.client_secret
        if not cid or not csec:
            logger.warning('AMADEUS client credentials not available for token fetch')
            raise Exception('AMADEUS_CLIENT_ID/AMADEUS_CLIENT_SECRET not configured')

        data = {'grant_type': 'client_credentials', 'client_id': cid, 'client_secret': csec}
        resp = requests.post(token_url, data=data, timeout=timeout)
        if resp.status_code != 200:
            logger.warning('Failed to fetch Amadeus token: %s %s', resp.status_code, resp.text)
            raise Exception(f'Failed to fetch Amadeus token: {resp.status_code}')

        body = resp.json()
        self.access_token = body.get('access_token')
        expires_in = body.get('expires_in') or 0
        try:
            self._token_expires_at = time.time() + int(expires_in) - 10
        except Exception:
            self._token_expires_at = None
        masked = f"{self.access_token[:4]}...{self.access_token[-4:]}" if self.access_token and len(self.access_token) > 8 else '***'
        logger.info('Fetched Amadeus token: %s', masked)
        return True

    def get_headers(self):
        headers = {'Accept': 'application/json'}
        if self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'
        return headers

    def make_request(self, endpoint, params=None, timeout=10):
        url = f"{self.base_url}{endpoint}"

        # Refresh token if expired and credentials are available
        if (not self.access_token or (self._token_expires_at and time.time() >= self._token_expires_at)) and (os.getenv('AMADEUS_CLIENT_ID') or self.client_id) and (os.getenv('AMADEUS_CLIENT_SECRET') or self.client_secret):
            try:
                self.fetch_token()
            except Exception:
                # continue and try with existing token if present
                pass

        headers = self.get_headers()
        try:
            masked_auth = headers.get('Authorization')[:10] + '...' + headers.get('Authorization')[-4:] if headers.get('Authorization') else None
        except Exception:
            masked_auth = None
        logger.info('Calling Amadeus %s with Authorization=%s', endpoint, masked_auth)

        resp = requests.get(url, headers=headers, params=params, timeout=timeout)

        # If unauthorized, try refresh once if client creds exist
        if resp.status_code == 401 and (os.getenv('AMADEUS_CLIENT_ID') or self.client_id) and (os.getenv('AMADEUS_CLIENT_SECRET') or self.client_secret):
            try:
                self.fetch_token()
                resp = requests.get(url, headers=self.get_headers(), params=params, timeout=timeout)
            except Exception:
                pass

        if resp.status_code == 200:
            try:
                return resp.json()
            except Exception:
                return {'error': 'invalid-json', 'status_code': resp.status_code, 'text': resp.text}

        # Non-200 -> return structured error info
        txt = ''
        try:
            txt = resp.text
            if len(txt) > 1000:
                txt = txt[:1000] + '...'
        except Exception:
            txt = '<no-text>'

        logger.warning('Amadeus returned %s for %s: %s', resp.status_code, endpoint, txt)
        return {'error': f'API error: {resp.status_code}', 'status_code': resp.status_code, 'text': resp.text}

    def get_flight_offers(self, origin, destination, departureDate, adults=1, max_results=1):
        params = {
            'originLocationCode': origin,
            'destinationLocationCode': destination,
            'departureDate': departureDate,
            'adults': adults,
            'max': max_results
        }
        return self.make_request('/v2/shopping/flight-offers', params)

    def _strip_html(self, text):
        if not text:
            return ''
        return re.sub(r'<[^>]*>', '', text).strip()

    def search_activities(self, latitude, longitude, radius='1', timeout=10):
        params = {'latitude': latitude, 'longitude': longitude, 'radius': radius}
        payload = self.make_request('/v1/shopping/activities', params=params, timeout=timeout)

        # If payload indicates an error, propagate
        if not isinstance(payload, dict) or 'data' not in payload:
            # return what make_request returned (error dict) or raw json
            return payload

        items = payload.get('data') or []
        result = []
        for it in items:
            name = it.get('name') or it.get('title') or ''
            desc = it.get('description') or it.get('shortDescription') or ''
            desc_text = self._strip_html(desc)
            pics = []
            raw_pics = it.get('pictures') or []
            for p in raw_pics:
                if isinstance(p, dict):
                    url_candidate = p.get('url') or p.get('src') or p.get('href') or p.get('link')
                    if url_candidate:
                        pics.append(url_candidate)
                elif isinstance(p, str):
                    pics.append(p)

            result.append({'title': name, 'description': desc_text, 'images': pics})

        return result
