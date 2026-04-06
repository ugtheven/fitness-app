import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "../components/ScreenHeader";
import { db } from "../db";
import { useAuth } from "../lib/auth";
import { type BackupMetadata, exportAllData, restoreAllData } from "../lib/backup";
import { downloadBackup, getBackupMetadata, uploadBackup } from "../lib/cloudBackup";
import {
	isHealthKitEnabled,
	requestHealthKitPermissions,
	setHealthKitEnabled,
	syncHealthKitData,
} from "../lib/healthkit";
import { todayStr } from "../lib/hydration";
import { resetHydration } from "../lib/hydrationQueries";
import { type Language, changeLanguage } from "../lib/i18n";
import { palette } from "../lib/palette";
import { borders, radius } from "../lib/tokens";
import { type UnitSystem, useUnits } from "../lib/units";

export default function SettingsScreen() {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const currentLang = i18n.language as Language;
	const { system, setSystem } = useUnits();

	const { user, signOut } = useAuth();
	const [healthKit, setHealthKit] = useState(false);
	useEffect(() => {
		isHealthKitEnabled().then(setHealthKit);
	}, []);

	const [backupMeta, setBackupMeta] = useState<BackupMetadata | null>(null);
	const [metaLoading, setMetaLoading] = useState(false);
	const [backupLoading, setBackupLoading] = useState(false);
	const [restoreLoading, setRestoreLoading] = useState(false);

	useEffect(() => {
		if (!user) return;
		setMetaLoading(true);
		getBackupMetadata(user.id)
			.then(setBackupMeta)
			.catch(() => {})
			.finally(() => setMetaLoading(false));
	}, [user]);

	function handleBackup() {
		if (!user) return;
		Alert.alert(t("settings.backupConfirmTitle"), t("settings.backupConfirmMessage"), [
			{ text: t("common.cancel"), style: "cancel" },
			{
				text: t("common.confirm"),
				onPress: async () => {
					setBackupLoading(true);
					try {
						const data = await exportAllData(db);
						await uploadBackup(user.id, data);
						setBackupMeta({
							version: data.version,
							exportedAt: data.exportedAt,
							entries: Object.values(data.tables).reduce((sum, rows) => sum + rows.length, 0),
						});
						Alert.alert(t("settings.backupSuccess"));
					} catch (e) {
						Alert.alert(t("settings.backupError"), e instanceof Error ? e.message : undefined);
					} finally {
						setBackupLoading(false);
					}
				},
			},
		]);
	}

	function handleRestore() {
		if (!user) return;
		Alert.alert(t("settings.restoreConfirmTitle"), t("settings.restoreConfirmMessage"), [
			{ text: t("common.cancel"), style: "cancel" },
			{
				text: t("common.confirm"),
				style: "destructive",
				onPress: async () => {
					setRestoreLoading(true);
					try {
						const data = await downloadBackup(user.id);
						await restoreAllData(db, data);
						Alert.alert(t("settings.restoreSuccess"));
					} catch (e) {
						const msg = e instanceof Error ? e.message : "";
						if (msg === "BACKUP_TOO_NEW") {
							Alert.alert(t("settings.updateRequired"));
						} else if (msg === "INVALID_BACKUP") {
							Alert.alert(t("settings.invalidBackup"));
						} else if (msg === "NO_BACKUP") {
							Alert.alert(t("settings.noBackupFound"));
						} else {
							Alert.alert(t("settings.restoreError"), msg || undefined);
						}
					} finally {
						setRestoreLoading(false);
					}
				},
			},
		]);
	}

	async function handleHealthKitToggle(value: boolean) {
		if (value) {
			await requestHealthKitPermissions();
			await setHealthKitEnabled(true);
			setHealthKit(true);
			syncHealthKitData();
		} else {
			await setHealthKitEnabled(false);
			setHealthKit(false);
		}
	}

	async function handleLanguageChange(lang: Language) {
		await changeLanguage(lang);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader title={t("settings.title")} onBack={() => router.back()} />

			<ScrollView className="flex-1 px-6" contentContainerClassName="pb-12">
				<View className="mt-4 gap-3">
					<Text
						className="text-sm font-medium uppercase tracking-widest"
						style={{ color: palette.muted.foreground }}
					>
						{t("settings.language")}
					</Text>
					<View
						className="overflow-hidden"
						style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
					>
						{(["en", "fr"] as Language[]).map((lang, index, arr) => (
							<Pressable
								key={lang}
								onPress={() => handleLanguageChange(lang)}
								className="active:opacity-70"
							>
								<View
									className="flex-row items-center justify-between px-5 py-4"
									style={
										index < arr.length - 1
											? {
													borderBottomWidth: borders.hairline,
													borderBottomColor: palette.separator,
												}
											: undefined
									}
								>
									<Text className="text-base text-foreground">
										{lang === "en" ? t("settings.english") : t("settings.french")}
									</Text>
									{currentLang === lang && (
										<View
											className="h-5 w-5 rounded-full items-center justify-center"
											style={{ backgroundColor: palette.foreground }}
										>
											<View
												className="h-2 w-2 rounded-full"
												style={{ backgroundColor: palette.background }}
											/>
										</View>
									)}
								</View>
							</Pressable>
						))}
					</View>

					{/* Units */}
					<View className="mt-4 gap-3">
						<Text
							className="text-sm font-medium uppercase tracking-widest"
							style={{ color: palette.muted.foreground }}
						>
							{t("settings.units")}
						</Text>
						<View
							className="overflow-hidden"
							style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
						>
							{(["metric", "imperial"] as UnitSystem[]).map((u, index, arr) => (
								<Pressable key={u} onPress={() => setSystem(u)} className="active:opacity-70">
									<View
										className="flex-row items-center justify-between px-5 py-4"
										style={
											index < arr.length - 1
												? {
														borderBottomWidth: borders.hairline,
														borderBottomColor: palette.separator,
													}
												: undefined
										}
									>
										<Text className="text-base text-foreground">{t(`settings.${u}`)}</Text>
										{system === u && (
											<View
												className="h-5 w-5 rounded-full items-center justify-center"
												style={{ backgroundColor: palette.foreground }}
											>
												<View
													className="h-2 w-2 rounded-full"
													style={{ backgroundColor: palette.background }}
												/>
											</View>
										)}
									</View>
								</Pressable>
							))}
						</View>
					</View>
				</View>

				{/* Apple Health */}
				<View className="mt-4 gap-3">
					<Text
						className="text-sm font-medium uppercase tracking-widest"
						style={{ color: palette.muted.foreground }}
					>
						{t("settings.appleHealth")}
					</Text>
					<Text className="text-xs mb-1" style={{ color: palette.muted.foreground }}>
						{t("settings.appleHealthDesc")}
					</Text>
					<View
						className="overflow-hidden"
						style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
					>
						{(["enabled", "disabled"] as const).map((option, index, arr) => (
							<Pressable
								key={option}
								onPress={() => handleHealthKitToggle(option === "enabled")}
								className="active:opacity-70"
							>
								<View
									className="flex-row items-center justify-between px-5 py-4"
									style={
										index < arr.length - 1
											? {
													borderBottomWidth: borders.hairline,
													borderBottomColor: palette.separator,
												}
											: undefined
									}
								>
									<View className="flex-row items-center gap-3">
										<Ionicons name="heart-outline" size={20} color={palette.foreground} />
										<Text className="text-base text-foreground">{t(`settings.${option}`)}</Text>
									</View>
									{healthKit === (option === "enabled") && (
										<View
											className="h-5 w-5 rounded-full items-center justify-center"
											style={{ backgroundColor: palette.foreground }}
										>
											<View
												className="h-2 w-2 rounded-full"
												style={{ backgroundColor: palette.background }}
											/>
										</View>
									)}
								</View>
							</Pressable>
						))}
					</View>

					{/* Account */}
					<View className="mt-4 gap-3">
						<Text
							className="text-sm font-medium uppercase tracking-widest"
							style={{ color: palette.muted.foreground }}
						>
							{t("auth.account")}
						</Text>
						<View
							className="overflow-hidden"
							style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
						>
							<View
								className="flex-row items-center gap-3 px-5 py-4"
								style={{
									borderBottomWidth: borders.hairline,
									borderBottomColor: palette.separator,
								}}
							>
								<Ionicons name="person-outline" size={20} color={palette.foreground} />
								<Text className="text-base text-foreground">
									{user?.email ?? t("auth.account")}
								</Text>
							</View>
							<Pressable
								onPress={() => {
									Alert.alert(t("auth.signOut"), undefined, [
										{ text: t("common.cancel"), style: "cancel" },
										{
											text: t("auth.signOut"),
											style: "destructive",
											onPress: () => signOut(),
										},
									]);
								}}
								className="active:opacity-70"
							>
								<View className="flex-row items-center gap-3 px-5 py-4">
									<Ionicons name="log-out-outline" size={20} color={palette.destructive.DEFAULT} />
									<Text className="text-base" style={{ color: palette.destructive.DEFAULT }}>
										{t("auth.signOut")}
									</Text>
								</View>
							</Pressable>
						</View>
					</View>

					{/* Cloud Backup — visible uniquement si authentifié */}
					{user && (
						<View className="mt-4 gap-3">
							<Text
								className="text-sm font-medium uppercase tracking-widest"
								style={{ color: palette.muted.foreground }}
							>
								{t("settings.cloudBackup")}
							</Text>
							<View
								className="overflow-hidden"
								style={{
									backgroundColor: palette.card.DEFAULT,
									borderRadius: radius.lg,
								}}
							>
								{/* Info dernière sauvegarde */}
								<View
									className="flex-row items-center gap-3 px-5 py-4"
									style={{
										borderBottomWidth: borders.hairline,
										borderBottomColor: palette.separator,
									}}
								>
									<Ionicons name="cloud-outline" size={20} color={palette.muted.foreground} />
									{metaLoading ? (
										<ActivityIndicator size="small" color={palette.muted.foreground} />
									) : backupMeta ? (
										<View>
											<Text className="text-base text-foreground">{t("settings.lastBackup")}</Text>
											<Text className="text-xs mt-0.5" style={{ color: palette.muted.foreground }}>
												{new Date(backupMeta.exportedAt).toLocaleDateString(i18n.language, {
													day: "numeric",
													month: "short",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}{" "}
												· {t("settings.backupEntries", { count: backupMeta.entries })}
											</Text>
										</View>
									) : (
										<Text className="text-base" style={{ color: palette.muted.foreground }}>
											{t("settings.noBackup")}
										</Text>
									)}
								</View>

								{/* Bouton Sauvegarder */}
								<Pressable
									onPress={handleBackup}
									disabled={backupLoading || restoreLoading}
									className="active:opacity-70"
								>
									<View
										className="flex-row items-center gap-3 px-5 py-4"
										style={{
											borderBottomWidth: borders.hairline,
											borderBottomColor: palette.separator,
											opacity: backupLoading || restoreLoading ? 0.5 : 1,
										}}
									>
										{backupLoading ? (
											<ActivityIndicator size="small" color={palette.foreground} />
										) : (
											<Ionicons name="cloud-upload-outline" size={20} color={palette.foreground} />
										)}
										<Text className="text-base text-foreground">
											{backupLoading ? t("settings.backupInProgress") : t("settings.backupNow")}
										</Text>
									</View>
								</Pressable>

								{/* Bouton Restaurer */}
								<Pressable
									onPress={handleRestore}
									disabled={backupLoading || restoreLoading}
									className="active:opacity-70"
								>
									<View
										className="flex-row items-center gap-3 px-5 py-4"
										style={{
											opacity: backupLoading || restoreLoading ? 0.5 : 1,
										}}
									>
										{restoreLoading ? (
											<ActivityIndicator size="small" color={palette.foreground} />
										) : (
											<Ionicons
												name="cloud-download-outline"
												size={20}
												color={palette.foreground}
											/>
										)}
										<Text className="text-base text-foreground">
											{restoreLoading
												? t("settings.restoreInProgress")
												: t("settings.restoreFromCloud")}
										</Text>
									</View>
								</Pressable>
							</View>
							<Text className="text-xs" style={{ color: palette.muted.foreground }}>
								{t("settings.restoreWarning")}
							</Text>
						</View>
					)}

					{/* Data */}
					<View className="mt-4 gap-3">
						<Text
							className="text-sm font-medium uppercase tracking-widest"
							style={{ color: palette.muted.foreground }}
						>
							{t("settings.data")}
						</Text>
						<View
							className="overflow-hidden"
							style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
						>
							<Pressable
								onPress={() => {
									Alert.alert(t("settings.resetHydration"), undefined, [
										{ text: t("common.cancel"), style: "cancel" },
										{
											text: t("common.confirm"),
											style: "destructive",
											onPress: () => resetHydration(todayStr()),
										},
									]);
								}}
								className="active:opacity-70"
							>
								<View className="flex-row items-center gap-3 px-5 py-4">
									<Ionicons name="water-outline" size={20} color={palette.destructive.DEFAULT} />
									<Text className="text-base" style={{ color: palette.destructive.DEFAULT }}>
										{t("settings.resetHydration")}
									</Text>
								</View>
							</Pressable>
						</View>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
