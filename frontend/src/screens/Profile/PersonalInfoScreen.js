import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAppTheme } from "../../theme/ThemeProvider";
import UserRepository from "../../backend/repositories/UserRepository";

/**
 * Helpers date
 * - DB peut renvoyer "2004-01-25" ou une date ISO.
 * - UI affiche "25 janvier 2004"
 * - En édition, on garde un champ "YYYY-MM-DD" (simple, sans dépendance).
 */
function toIsoDateString(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatFrenchDate(value) {
  const iso = toIsoDateString(value);
  if (!iso) return "Non défini";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Non défini";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Validation stricte pour éviter les dates "rollover" (ex: 2003-22-41)
function isValidIsoDate(iso) {
  if (!iso) return true; // champ optionnel
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;

  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return false;

  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() + 1 === m &&
    dt.getUTCDate() === d
  );
}

const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;

function validateForm({ firstName, lastName, country, dateOfBirth }) {
  const errors = {};
  const fn = firstName.trim();
  const ln = lastName.trim();
  const ct = country.trim();
  const dob = dateOfBirth.trim();

  if (!fn) errors.firstName = "Prénom requis";
  else if (!NAME_RE.test(fn)) errors.firstName = "Prénom invalide";

  if (!ln) errors.lastName = "Nom requis";
  else if (!NAME_RE.test(ln)) errors.lastName = "Nom invalide";

  // Pays : optionnel (tu peux le rendre obligatoire si tu veux)
  if (ct && ct.length < 2) errors.country = "Pays invalide";

  if (!isValidIsoDate(dob)) errors.dateOfBirth = "Date invalide (YYYY-MM-DD)";

  return errors;
}

/**
 * ✅ IMPORTANT:
 * InfoRow est défini EN DEHORS du screen pour éviter le remount à chaque frappe
 * (sinon Android perd le focus sur TextInput).
 */
const InfoRow = React.memo(function InfoRow({
  colors,
  label,
  value,
  editable,
  onChangeText,
  placeholder,
  keyboardType,
  errorText,
  autoCapitalize = "words",
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.mutedText }]}>{label}</Text>

      {editable ? (
        <>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedText}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: errorText ? "#ef4444" : colors.border,
                backgroundColor: colors.card,
              },
            ]}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            blurOnSubmit={false}
          />
          {errorText ? <Text style={styles.errorHint}>{errorText}</Text> : null}
        </>
      ) : (
        <Text style={[styles.value, { color: colors.text }]}>
          {value || "Non défini"}
        </Text>
      )}
    </View>
  );
});

export default function PersonalInfoScreen({ navigation }) {
  const { colors } = useAppTheme();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);

  // Form (édition)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(""); // YYYY-MM-DD

  const [formErrors, setFormErrors] = useState({});

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await UserRepository.getProfile();
      setProfile(data);

      // pré-remplir form
      setFirstName(data?.firstName ?? "");
      setLastName(data?.lastName ?? "");
      setCountry(data?.country ?? "");
      setDateOfBirth(toIsoDateString(data?.dateOfBirth));
    } catch (err) {
      console.error("Erreur chargement profil:", err);
      setError("Impossible de charger les informations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Validation live en mode édition
  useEffect(() => {
    if (!isEditing) return;
    setFormErrors(validateForm({ firstName, lastName, country, dateOfBirth }));
  }, [isEditing, firstName, lastName, country, dateOfBirth]);

  const onPressEdit = () => {
    setIsEditing(true);
    setFormErrors(validateForm({ firstName, lastName, country, dateOfBirth }));
  };

  const onPressCancel = () => {
    setFirstName(profile?.firstName ?? "");
    setLastName(profile?.lastName ?? "");
    setCountry(profile?.country ?? "");
    setDateOfBirth(toIsoDateString(profile?.dateOfBirth));
    setFormErrors({});
    setIsEditing(false);
  };

  const changedPayload = useMemo(() => {
    if (!profile) return {};
    const payload = {};

    if ((profile.firstName ?? "") !== firstName.trim())
      payload.firstName = firstName.trim();

    if ((profile.lastName ?? "") !== lastName.trim())
      payload.lastName = lastName.trim();

    if ((profile.country ?? "") !== country.trim())
      payload.country = country.trim();

    const currentIso = toIsoDateString(profile.dateOfBirth);
    const nextIso = dateOfBirth.trim();
    if (currentIso !== nextIso) payload.dateOfBirth = nextIso || null;

    return payload;
  }, [profile, firstName, lastName, country, dateOfBirth]);

  const onPressSave = async () => {
    const errorsNow = validateForm({ firstName, lastName, country, dateOfBirth });
    setFormErrors(errorsNow);

    if (Object.keys(errorsNow).length > 0) {
      Alert.alert("Formulaire invalide", "Corrige les champs en rouge.");
      return;
    }

    const payload = changedPayload;
    if (!payload || Object.keys(payload).length === 0) {
      setIsEditing(false);
      return;
    }

    try {
      setSaving(true);
      await UserRepository.updateProfile(payload);

      await loadProfile(); // reload DB
      setIsEditing(false);
      Alert.alert("OK", "Profil mis à jour.");
    } catch (err) {
      console.error("Erreur updateProfile:", err);
      Alert.alert("Erreur", "Impossible d'enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  };

  const hasErrors = Object.keys(formErrors).length > 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Informations personnelles
        </Text>

        {!isEditing ? (
          <TouchableOpacity onPress={onPressEdit} disabled={loading || !!error}>
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={onPressCancel} disabled={saving}>
              <Text style={{ color: colors.mutedText, fontWeight: "600" }}>
                Annuler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onPressSave} disabled={saving || hasErrors}>
              <Text
                style={{
                  color: saving || hasErrors ? colors.mutedText : colors.primary,
                  fontWeight: "800",
                }}
              >
                Enregistrer
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.help, { color: colors.mutedText }]}>
            Chargement...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={40}
            color={colors.mutedText}
          />
          <Text style={[styles.error, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={loadProfile}
          >
            <Text style={styles.retryTxt}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          >
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.cardTitleRow}>
                <Ionicons
                  name="person-circle-outline"
                  size={22}
                  color={colors.primary}
                />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Informations personnelles
                </Text>
              </View>

              <InfoRow
                colors={colors}
                label="PRÉNOM"
                value={isEditing ? firstName : profile?.firstName}
                editable={isEditing}
                onChangeText={setFirstName}
                placeholder="Prénom"
                errorText={isEditing ? formErrors.firstName : null}
              />

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <InfoRow
                colors={colors}
                label="NOM"
                value={isEditing ? lastName : profile?.lastName}
                editable={isEditing}
                onChangeText={setLastName}
                placeholder="Nom"
                errorText={isEditing ? formErrors.lastName : null}
              />

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Email affiché mais pas modifiable */}
              <InfoRow colors={colors} label="EMAIL" value={profile?.email} editable={false} />

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <InfoRow
                colors={colors}
                label="PAYS"
                value={isEditing ? country : profile?.country}
                editable={isEditing}
                onChangeText={setCountry}
                placeholder="Pays"
                errorText={isEditing ? formErrors.country : null}
              />

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {!isEditing ? (
                <InfoRow
                  colors={colors}
                  label="DATE DE NAISSANCE"
                  value={formatFrenchDate(profile?.dateOfBirth)}
                  editable={false}
                />
              ) : (
                <InfoRow
                  colors={colors}
                  label="DATE DE NAISSANCE (YYYY-MM-DD)"
                  value={dateOfBirth}
                  editable={true}
                  onChangeText={setDateOfBirth}
                  placeholder="2004-01-25"
                  keyboardType="numbers-and-punctuation"
                  autoCapitalize="none"
                  errorText={isEditing ? formErrors.dateOfBirth : null}
                />
              )}
            </View>

            {saving && (
              <View style={{ marginTop: 12, alignItems: "center" }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.help, { color: colors.mutedText }]}>
                  Enregistrement...
                </Text>
              </View>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: "800" },

  content: { padding: 16, paddingBottom: 24 },

  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "800" },

  row: { paddingVertical: 10 },
  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  value: { fontSize: 14, fontWeight: "600" },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "600",
  },

  errorHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "600",
  },

  divider: { height: 1, opacity: 0.9 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  help: { marginTop: 10, fontSize: 13 },
  error: { marginTop: 10, fontSize: 15, textAlign: "center" },

  retryBtn: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  retryTxt: { color: "white", fontWeight: "800" },
});
