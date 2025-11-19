import os
import time
import logging
import re
import requests
from flask import current_app

logger = logging.getLogger(__name__)


class AmadeusClient:
    """Amadeus client: token management + flight offers + activities search."""

    TOKEN_PATH = '/v1/security/oauth2/token'

    def __init__(self, app=None):
        cfg = getattr(app, 'config', {}) if app is not None else (current_app.config if current_app else {})
        self.base_url = (os.getenv('AMADEUS_BASE_URL') or cfg.get('AMADEUS_BASE_URL') or 'https://test.api.amadeus.com').rstrip('/')
        self.access_token = os.getenv('AMADEUS_ACCESS_TOKEN') or cfg.get('AMADEUS_ACCESS_TOKEN')
        self.client_id = os.getenv('AMADEUS_CLIENT_ID') or cfg.get('AMADEUS_CLIENT_ID')
        self.client_secret = os.getenv('AMADEUS_CLIENT_SECRET') or cfg.get('AMADEUS_CLIENT_SECRET')
        self._token_expires_at = None

    def fetch_token(self, timeout=10):
        token_url = f"{self.base_url}{self.TOKEN_PATH}"
        cid = os.getenv('AMADEUS_CLIENT_ID') or self.client_id
        csec = os.getenv('AMADEUS_CLIENT_SECRET') or self.client_secret
        if not cid or not csec:
            raise Exception('AMADEUS_CLIENT_ID/AMADEUS_CLIENT_SECRET not configured')

        data = {'grant_type': 'client_credentials', 'client_id': cid, 'client_secret': csec}
        resp = requests.post(token_url, data=data, timeout=timeout)
        resp.raise_for_status()
        body = resp.json()
        self.access_token = body.get('access_token')
        expires_in = body.get('expires_in') or 0
        try:
            self._token_expires_at = time.time() + int(expires_in) - 10
        except Exception:
            self._token_expires_at = None
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
                pass

        resp = requests.get(url, headers=self.get_headers(), params=params, timeout=timeout)
        if resp.status_code == 401 and (os.getenv('AMADEUS_CLIENT_ID') or self.client_id) and (os.getenv('AMADEUS_CLIENT_SECRET') or self.client_secret):
            try:
                self.fetch_token()
                resp = requests.get(url, headers=self.get_headers(), params=params, timeout=timeout)
            except Exception:
                pass

        if resp.status_code == 200:
            return resp.json()
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
        if not isinstance(payload, dict) or 'data' not in payload:
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
