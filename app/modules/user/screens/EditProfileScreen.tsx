import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Appbar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CountryFlag from "react-native-country-flag";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "../../../core/i18n";
import { USER_STACK } from "../../../core/navigation/routes";
import type { UserStackParamList } from "../../../core/navigation/types";
import { Toast } from "../../../core/ui";
import { FormField } from "../components/FormField";
import { SaveButton } from "../components/SaveButton";
import { UserBottomSheet, BottomSheetItem } from "../components/UserBottomSheet";

type Props = NativeStackScreenProps<UserStackParamList, typeof USER_STACK.EditProfile>;

interface CountryCode {
  code: string;
  dial: string;
  name: string;
}

const COUNTRIES: CountryCode[] = [
  { code: "us", dial: "+1", name: "United States" },
  { code: "cn", dial: "+86", name: "China" },
  { code: "gb", dial: "+44", name: "United Kingdom" },
];

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function parseDate(str: string): Date | null {
  const parts = str.split("/");
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parseInt(parts[2], 10);
  const date = new Date(y, m, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * 个人资料编辑页（Edit Profile）。
 *
 * 包含头像占位、个人信息表单、区号选择及日期选择器，
 * 校验通过后点击 Save Changes 保存并返回。
 */
export default function EditProfileScreen({ navigation }: Props) {
  const { t } = useTranslation(["common"]);

  const [name, setName] = useState("Wade Warren");
  const [email, setEmail] = useState("wade-warren@gmail.com");
  const [phone, setPhone] = useState("(239) 555-0108");
  const [countryCode, setCountryCode] = useState<CountryCode>({
    code: "us",
    dial: "+1",
    name: "United States",
  });
  const [dob, setDob] = useState("04/12/1992");

  const [countrySheetVisible, setCountrySheetVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const dobDate = useMemo(() => parseDate(dob) ?? new Date(), [dob]);
  const [tempDate, setTempDate] = useState<Date>(() => parseDate(dob) ?? new Date());

  const isValid = useMemo(() => {
    if (!name.trim()) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    if (!phone.trim()) return false;
    if (!dob.trim()) return false;
    return true;
  }, [name, email, phone, dob]);

  const handleSave = useCallback(() => {
    Toast.show({
      type: "success",
      text1: "Profile saved successfully",
    });
    navigation.goBack();
  }, [navigation]);

  const handleDateChange = useCallback(
    (_event: any, selectedDate?: Date) => {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    },
    [],
  );

  const handleConfirmDate = useCallback(() => {
    setDob(formatDate(tempDate));
    setDatePickerVisible(false);
  }, [tempDate]);

  const handleCancelDate = useCallback(() => {
    setTempDate(dobDate);
    setDatePickerVisible(false);
  }, [dobDate]);

  const countrySelector = (
    <Pressable
      onPress={() => setCountrySheetVisible(true)}
      style={styles.countrySelector}
    >
      <CountryFlag isoCode={countryCode.code} size={18} />
      <Text style={styles.dialText}>{countryCode.dial}</Text>
      <MaterialCommunityIcons name="chevron-down" size={16} color="#A5A5A5" />
      <View style={styles.countryDivider} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header mode="small" statusBarHeight={0} style={{ backgroundColor: "#F5F5F5" }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Edit Profile" titleStyle={styles.appBarTitle} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="account" size={40} color="#A5A5A5" />
            <View style={styles.cameraBadge}>
              <MaterialCommunityIcons name="camera" size={14} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Personal Info Label */}
        <Text style={styles.sectionLabel}>Personal Info</Text>

        {/* Form Card */}
        <View style={styles.formCard}>
          <FormField label="Full Name" value={name} onChangeText={setName} />
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <FormField
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftElement={countrySelector}
          />
          <FormField
            label="Date Of Birth"
            value={dob}
            onPress={() => setDatePickerVisible(true)}
            rightIcon="calendar-outline"
            editable={false}
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <SaveButton
        title="Save Changes"
        disabled={!isValid}
        onPress={handleSave}
      />

      {/* Country Code BottomSheet */}
      <UserBottomSheet
        visible={countrySheetVisible}
        title="Country Code"
        onClose={() => setCountrySheetVisible(false)}
      >
        {COUNTRIES.map((country) => (
          <BottomSheetItem
            key={country.code}
            icon={<CountryFlag isoCode={country.code} size={22} />}
            title={`${country.name} (${country.dial})`}
            selected={countryCode.code === country.code}
            onPress={() => {
              setCountryCode(country);
              setCountrySheetVisible(false);
            }}
          />
        ))}
      </UserBottomSheet>

      {/* Date Picker Modal */}
      <Modal
        visible={datePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDate}
      >
        <View style={pickerStyles.overlay}>
          <View style={pickerStyles.card}>
            <View style={pickerStyles.toolbar}>
              <Pressable onPress={handleCancelDate}>
                <Text style={pickerStyles.toolbarBtn}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmDate}>
                <Text style={[pickerStyles.toolbarBtn, pickerStyles.toolbarBtnPrimary]}>Confirm</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  appBarTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#A5A5A5",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    color: "#A5A5A5",
    marginBottom: 12,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: 8,
  },
  dialText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: "#151515",
  },
  countryDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E8E8E8",
    marginLeft: 4,
  },
});

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingTop: 16,
    paddingBottom: 8,
    width: "100%",
    alignItems: "center",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
    width: "100%",
  },
  toolbarBtn: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    color: "#A5A5A5",
  },
  toolbarBtnPrimary: {
    color: "#6065E6",
  },
});
