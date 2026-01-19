import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import UserRepository from '../backend/repositories/UserRepository';

const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;
const COUNTRY_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,60}$/;
const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

const normalizeValue = (value) => (value ?? '').trim();

const formatDateInput = (value) => {
	const digits = value.replace(/\D/g, '').slice(0, 8);
	if (digits.length <= 2) {
		return digits;
	}
	if (digits.length <= 4) {
		return `${digits.slice(0, 2)}/${digits.slice(2)}`;
	}
	return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const isSimpleDateRangeValid = (value) => {
	if (!DATE_REGEX.test(value)) {
		return false;
	}

	const [day, month] = value.split('/').map((part) => Number(part));
	return day >= 1 && day <= 31 && month >= 1 && month <= 12;
};

const toDisplayDate = (isoDate) => {
	const match = /^\d{4}-\d{2}-\d{2}$/.exec(isoDate);
	if (!match) {
		return '';
	}
	const [year, month, day] = isoDate.split('-');
	return `${day}/${month}/${year}`;
};

const toIsoDate = (displayDate) => {
	if (!DATE_REGEX.test(displayDate)) {
		return '';
	}
	const [day, month, year] = displayDate.split('/');
	return `${year}-${month}-${day}`;
};

const isRealDate = (value) => {
	if (!DATE_REGEX.test(value)) {
		return false;
	}

	const [day, month, year] = value.split('/').map((part) => Number(part));
	const date = new Date(year, month - 1, day);

	return (
		date.getFullYear() === year &&
		date.getMonth() === month - 1 &&
		date.getDate() === day
	);
};

const isAtLeastTenYearsOld = (value) => {
	if (!isRealDate(value)) {
		return false;
	}

	const [day, month, year] = value.split('/').map((part) => Number(part));
	const birthDate = new Date(year, month - 1, day);
	const today = new Date();
	const minimumDate = new Date(
		today.getFullYear() - 10,
		today.getMonth(),
		today.getDate()
	);

	return birthDate <= minimumDate;
};

const PersonalInfoScreen = ({ navigation }) => {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [toast, setToast] = useState({ visible: false, message: '' });
	const [initialProfile, setInitialProfile] = useState({
		firstName: '',
		lastName: '',
		email: '',
		country: '',
		dateOfBirth: '',
	});
	const [form, setForm] = useState({
		firstName: '',
		lastName: '',
		email: '',
		country: '',
		dateOfBirth: '',
	});

	const lastNameRef = useRef(null);
	const countryRef = useRef(null);
	const dateOfBirthRef = useRef(null);
	const toastTimerRef = useRef(null);

	useEffect(() => {
		const loadProfile = async () => {
			try {
				const profile = await UserRepository.getProfile();
				const safeProfile = {
					firstName: profile?.firstName ?? '',
					lastName: profile?.lastName ?? '',
					email: profile?.email ?? '',
					country: profile?.country ?? '',
					dateOfBirth: toDisplayDate(profile?.dateOfBirth ?? ''),
				};

				setInitialProfile(safeProfile);
				setForm(safeProfile);
			} catch (error) {
				Alert.alert('Erreur', "Impossible de charger le profil.");
			} finally {
				setLoading(false);
			}
		};

		loadProfile();
	}, []);

	const isDirty = useMemo(() => {
		return (
			normalizeValue(form.firstName) !== normalizeValue(initialProfile.firstName) ||
			normalizeValue(form.lastName) !== normalizeValue(initialProfile.lastName) ||
			normalizeValue(form.country) !== normalizeValue(initialProfile.country) ||
			normalizeValue(form.dateOfBirth) !== normalizeValue(initialProfile.dateOfBirth)
		);
	}, [form, initialProfile]);

	const getValidationError = () => {
		const firstName = normalizeValue(form.firstName);
		const lastName = normalizeValue(form.lastName);
		const country = normalizeValue(form.country);
		const dateOfBirth = normalizeValue(form.dateOfBirth);

		if (!NAME_REGEX.test(firstName)) {
			return "Veuillez saisir un prénom valide (2-50 caractères, lettres, espaces, tirets, apostrophes).";
		}

		if (!NAME_REGEX.test(lastName)) {
			return "Veuillez saisir un nom valide (2-50 caractères, lettres, espaces, tirets, apostrophes).";
		}

		if (!COUNTRY_REGEX.test(country)) {
			return "Veuillez saisir un pays valide (2-60 caractères, lettres, espaces, tirets, apostrophes).";
		}

		if (!DATE_REGEX.test(dateOfBirth)) {
			return "La date de naissance doit être au format JJ/MM/AAAA.";
		}

		if (!isSimpleDateRangeValid(dateOfBirth)) {
			return "La date de naissance doit contenir un jour (1-31) et un mois (1-12).";
		}

		if (!isRealDate(dateOfBirth)) {
			return "La date de naissance n'est pas une date valide.";
		}

		const [day, month, year] = dateOfBirth.split('/').map((part) => Number(part));
		const birthDate = new Date(year, month - 1, day);
		const today = new Date();
		if (birthDate > today) {
			return "La date de naissance doit être dans le passé.";
		}

		if (!isAtLeastTenYearsOld(dateOfBirth)) {
			return "Vous devez avoir au moins 10 ans.";
		}

		return '';
	};

	const isFormValid = useMemo(() => getValidationError() === '', [form]);

	const updateField = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const handleSave = async () => {
		const errorMessage = getValidationError();
		if (errorMessage) {
			Alert.alert('Informations invalides', errorMessage);
			return;
		}

		setSaving(true);
		try {
			const isoDateOfBirth = toIsoDate(normalizeValue(form.dateOfBirth));
			await UserRepository.updateProfile({
				firstName: normalizeValue(form.firstName),
				lastName: normalizeValue(form.lastName),
				country: normalizeValue(form.country),
				dateOfBirth: isoDateOfBirth,
			});
			if (toastTimerRef.current) {
				clearTimeout(toastTimerRef.current);
			}
			setToast({ visible: true, message: 'Profil mis à jour avec succès' });
			toastTimerRef.current = setTimeout(() => {
				setToast({ visible: false, message: '' });
				navigation.goBack();
			}, 1200);
		} catch (error) {
			Alert.alert('Erreur', "Impossible d'enregistrer les modifications.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
			<View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
				<View style={styles.headerRow}>
					<TouchableOpacity onPress={() => navigation.goBack()} disabled={saving}>
						<Text style={[styles.headerActionText, { color: theme.primary }, saving && styles.headerActionDisabled]}>
							Annuler
						</Text>
					</TouchableOpacity>
					<Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
						Informations personnelles
					</Text>
					<View style={styles.headerSpacer} />
				</View>
			</View>

			{loading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={theme.primary} />
					<Text style={[styles.loadingText, { color: theme.textSecondary }]}>Chargement...</Text>
				</View>
			) : (
				<ScrollView contentContainerStyle={styles.scrollContent}>
					<View style={[styles.card, { backgroundColor: theme.card }]}>
						<View style={styles.section}>
							<Text style={[styles.label, { color: theme.text }]}>Prénom</Text>
							<TextInput
								style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
								value={form.firstName}
								onChangeText={(value) => updateField('firstName', value)}
								placeholder="Prénom"
								placeholderTextColor={theme.textSecondary}
								autoCapitalize="words"
								returnKeyType="next"
								onSubmitEditing={() => lastNameRef.current?.focus()}
								blurOnSubmit={false}
							/>
						</View>

						<View style={styles.section}>
							<Text style={[styles.label, { color: theme.text }]}>Nom</Text>
							<TextInput
								ref={lastNameRef}
								style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
								value={form.lastName}
								onChangeText={(value) => updateField('lastName', value)}
								placeholder="Nom"
								placeholderTextColor={theme.textSecondary}
								autoCapitalize="words"
								returnKeyType="next"
								onSubmitEditing={() => countryRef.current?.focus()}
								blurOnSubmit={false}
							/>
						</View>

						<View style={styles.section}>
							<Text style={[styles.label, { color: theme.text }]}>Email</Text>
							<TextInput
								style={[styles.input, styles.inputDisabled, { backgroundColor: theme.background, color: theme.textSecondary, borderColor: theme.border }]}
								value={form.email}
								editable={false}
								keyboardType="email-address"
								autoCapitalize="none"
								placeholder="Email"
								placeholderTextColor={theme.textSecondary}
							/>
						</View>

						<View style={styles.section}>
							<Text style={[styles.label, { color: theme.text }]}>Pays</Text>
							<TextInput
								ref={countryRef}
								style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
								value={form.country}
								onChangeText={(value) => updateField('country', value)}
								placeholder="Pays"
								placeholderTextColor={theme.textSecondary}
								autoCapitalize="words"
								returnKeyType="next"
								onSubmitEditing={() => dateOfBirthRef.current?.focus()}
								blurOnSubmit={false}
							/>
						</View>

						<View style={styles.sectionNoBorder}>
							<Text style={[styles.label, { color: theme.text }]}>Date de naissance</Text>
							<TextInput
								ref={dateOfBirthRef}
								style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
								value={form.dateOfBirth}
								onChangeText={(value) => updateField('dateOfBirth', formatDateInput(value))}
								placeholder="JJ/MM/AAAA"
								placeholderTextColor={theme.textSecondary}
								keyboardType="number-pad"
								returnKeyType="done"
								onSubmitEditing={handleSave}
							/>
						</View>
					</View>

					<TouchableOpacity
						style={[
							styles.saveButton,
							(!isDirty || !isFormValid || saving) && styles.saveButtonDisabled,
						]}
						onPress={handleSave}
						disabled={!isDirty || !isFormValid || saving}
					>
						<Text style={styles.saveButtonText}>
							{saving ? 'Enregistrement...' : 'Enregistrer'}
						</Text>
					</TouchableOpacity>
				</ScrollView>
			)}
			{toast.visible && (
				<View style={styles.toastContainer} pointerEvents="none">
					<Text style={styles.toastText}>{toast.message}</Text>
				</View>
			)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F9FAFB',
	},
	header: {
		paddingTop: 12,
		paddingHorizontal: 20,
		paddingBottom: 20,
		backgroundColor: '#FFFFFF',
		borderBottomWidth: 1,
		borderBottomColor: '#EFF1F4',
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	headerSpacer: {
		width: 60,
	},
	headerTitle: {
		flex: 1,
		textAlign: 'center',
		fontSize: 18,
		fontWeight: '700',
		color: '#111',
	},
	headerActionText: {
		fontSize: 14,
		color: '#2563EB',
		fontWeight: '500',
	},
	headerActionDisabled: {
		color: '#9CA3AF',
	},
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	loadingText: {
		marginTop: 12,
		color: '#6B7280',
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingTop: 28,
		paddingBottom: 24,
	},
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 12,
		shadowColor: '#000',
		shadowOpacity: 0.06,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 3,
		marginBottom: 20,
	},
	section: {
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#F1F3F5',
	},
	sectionNoBorder: {
		paddingVertical: 10,
	},
	label: {
		fontSize: 13,
		fontWeight: '500',
		color: '#6B7280',
		marginBottom: 6,
	},
	input: {
		borderWidth: 1,
		borderColor: '#E6E8EC',
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 11,
		fontSize: 15,
		color: '#111',
		backgroundColor: '#F9FAFB',
	},
	inputDisabled: {
		backgroundColor: '#F3F4F6',
		color: '#6B7280',
	},
	saveButton: {
		backgroundColor: '#004aad',
		borderRadius: 14,
		paddingVertical: 14,
		alignItems: 'center',
		shadowColor: '#004aad',
		shadowOpacity: 0.15,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 2,
	},
	saveButtonDisabled: {
		backgroundColor: '#A7C5F9',
		shadowOpacity: 0,
	},
	saveButtonText: {
		color: '#FFFFFF',
		fontWeight: '600',
		fontSize: 16,
	},
	toastContainer: {
		position: 'absolute',
		bottom: 24,
		left: 20,
		right: 20,
		backgroundColor: '#FFFFFF',
		borderRadius: 14,
		paddingVertical: 12,
		paddingHorizontal: 14,
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 6 },
		elevation: 4,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	toastText: {
		color: '#0F172A',
		fontSize: 14,
		fontWeight: '600',
		textAlign: 'center',
	},
});

export default PersonalInfoScreen;
