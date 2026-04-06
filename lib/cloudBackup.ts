import {
	type BackupData,
	type BackupMetadata,
	countEntries,
	deserializeBackup,
	serializeBackup,
} from "./backup";
import { supabase } from "./supabase";

const BUCKET = "backups";
const backupPath = (userId: string) => `${userId}/backup.json.gz`;
const metadataPath = (userId: string) => `${userId}/metadata.json`;

export async function uploadBackup(userId: string, data: BackupData): Promise<void> {
	const compressed = serializeBackup(data);

	const { error: uploadError } = await supabase.storage
		.from(BUCKET)
		.upload(backupPath(userId), compressed, {
			contentType: "application/gzip",
			upsert: true,
		});
	if (uploadError) throw uploadError;

	const metadata: BackupMetadata = {
		version: data.version,
		exportedAt: data.exportedAt,
		entries: countEntries(data),
	};
	const { error: metaError } = await supabase.storage
		.from(BUCKET)
		.upload(metadataPath(userId), JSON.stringify(metadata), {
			contentType: "application/json",
			upsert: true,
		});
	if (metaError) throw metaError;
}

export async function downloadBackup(userId: string): Promise<BackupData> {
	const { data, error } = await supabase.storage.from(BUCKET).download(backupPath(userId));
	if (error) throw new Error("NO_BACKUP");

	const arrayBuffer = await data.arrayBuffer();
	return deserializeBackup(new Uint8Array(arrayBuffer));
}

export async function getBackupMetadata(userId: string): Promise<BackupMetadata | null> {
	const { data, error } = await supabase.storage.from(BUCKET).download(metadataPath(userId));
	if (error) return null;

	const text = await data.text();
	return JSON.parse(text) as BackupMetadata;
}
