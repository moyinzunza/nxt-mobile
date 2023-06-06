/* eslint-disable import/prefer-default-export */
import AsyncStorage from '@react-native-async-storage/async-storage';
import compareVersions from 'compare-versions';
import {
  WHATS_NEW_VERSION_SEEN,
  CURRENT_APP_VERSION,
  LAST_APP_VERSION,
} from '../../constants/storage';
import { whatsNewList } from '../../components/UI/WhatsNewModal';

/**
 * Returns boolean indicating whether or not to show whats new modal
 *
 * @returns Boolean indicating whether or not to show whats new modal
 */
export const shouldShowWhatsNewModal = async () => {
  const minAppVersion = whatsNewList.minAppVersion;
  const maxAppVersion = whatsNewList.maxAppVersion;
  const disabled = whatsNewList.disabled;
  const onlyUpdates = whatsNewList.onlyUpdates;

  // Whats new content is disabled
  if (disabled) return false;

  // Whats new content version seen
  const whatsNewVersionSeen = await AsyncStorage.getItem(
    WHATS_NEW_VERSION_SEEN,
  );

  const currentAppVersion = (await AsyncStorage.getItem(
    CURRENT_APP_VERSION,
  )) as string;
  const lastAppVersion = await AsyncStorage.getItem(LAST_APP_VERSION);

  const isUpdate = !!lastAppVersion && currentAppVersion !== lastAppVersion;

  const isInRange =
    compareVersions.compare(currentAppVersion, minAppVersion, '>=') &&
    compareVersions.compare(currentAppVersion, maxAppVersion, '<=');

  const seen =
    !!whatsNewVersionSeen && whatsNewVersionSeen === `${whatsNewList.version}`;

  if (!isInRange) return false;
  if (seen) return false;
  if (onlyUpdates && !isUpdate) return false;
  return whatsNewList.slides.length > 0;
};
