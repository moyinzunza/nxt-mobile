import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from 'react';

import {
  ActivityIndicator,
  AppState,
  StyleSheet,
  View,
  PushNotificationIOS, // eslint-disable-line react-native/split-platform-components
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import PropTypes from 'prop-types';
import { connect, useSelector } from 'react-redux';
import GlobalAlert from '../../UI/GlobalAlert';
import BackgroundTimer from 'react-native-background-timer';
import NotificationManager from '../../../core/NotificationManager';
import Engine from '../../../core/Engine';
import AppConstants from '../../../core/AppConstants';
import PushNotification from 'react-native-push-notification';
import I18n, { strings } from '../../../../locales/i18n';
import FadeOutOverlay from '../../UI/FadeOutOverlay';
import Device from '../../../util/device';
import BackupAlert from '../../UI/BackupAlert';
import Notification from '../../UI/Notification';
import RampOrders from '../../UI/Ramp';
import {
  showTransactionNotification,
  hideCurrentNotification,
  showSimpleNotification,
  removeNotificationById,
  removeNotVisibleNotifications,
} from '../../../actions/notification';
import ProtectYourWalletModal from '../../UI/ProtectYourWalletModal';
import MainNavigator from './MainNavigator';
import SkipAccountSecurityModal from '../../UI/SkipAccountSecurityModal';
import { query } from '@metamask/controller-utils';
import SwapsLiveness from '../../UI/Swaps/SwapsLiveness';

import {
  setInfuraAvailabilityBlocked,
  setInfuraAvailabilityNotBlocked,
} from '../../../actions/infuraAvailability';

import { createStackNavigator } from '@react-navigation/stack';
import ReviewModal from '../../UI/ReviewModal';
import { useTheme } from '../../../util/theme';
import RootRPCMethodsUI from './RootRPCMethodsUI';
import { colors as importedColors } from '../../../styles/common';
import {
  getNetworkImageSource,
  getNetworkNameFromProviderConfig,
} from '../../../util/networks';
import {
  ToastContext,
  ToastVariants,
} from '../../../component-library/components/Toast';
import { useEnableAutomaticSecurityChecks } from '../../hooks/EnableAutomaticSecurityChecks';
import { useMinimumVersions } from '../../hooks/MinimumVersions';
import navigateTermsOfUse from '../../../util/termsOfUse/termsOfUse';
import {
  selectProviderConfig,
  selectProviderType,
} from '../../../selectors/networkController';
import WarningAlert from '../../../components/UI/WarningAlert/WarningAlert';
import { LINEA_MAINNET } from '../../../constants/network';
import jsonRpcRequest from '../../../util/jsonRpcRequest';
import { LINEA_MAINNET_RPC_URL } from '../../../constants/urls';

const Stack = createStackNavigator();

const createStyles = (colors) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    loader: {
      backgroundColor: colors.background.default,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

const Main = (props) => {
  const [connected, setConnected] = useState(true);
  const [forceReload, setForceReload] = useState(false);
  const [showRemindLaterModal, setShowRemindLaterModal] = useState(false);
  const [skipCheckbox, setSkipCheckbox] = useState(false);
  const [showLineaMainnetAlert, setShowLineaMainnetAlert] = useState(false);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const backgroundMode = useRef(false);
  const locale = useRef(I18n.locale);
  const removeConnectionStatusListener = useRef();

  const removeNotVisibleNotifications = props.removeNotVisibleNotifications;

  useEnableAutomaticSecurityChecks();
  useMinimumVersions();

  useEffect(() => {
    const { TransactionController } = Engine.context;

    if (props.thirdPartyApiMode) {
      TransactionController.startIncomingTransactionPolling();
    } else {
      TransactionController.stopIncomingTransactionPolling();
    }
  }, [props.thirdPartyApiMode]);

  const connectionChangeHandler = useCallback(
    (state) => {
      if (!state) return;
      const { isConnected } = state;
      // Show the modal once the status changes to offline
      if (connected && isConnected === false) {
        props.navigation.navigate('OfflineModeView');
      }
      if (connected !== isConnected && isConnected !== null) {
        setConnected(isConnected);
      }
    },
    [connected, setConnected, props.navigation],
  );

  const checkInfuraAvailability = useCallback(async () => {
    if (props.providerType !== 'rpc') {
      try {
        const { TransactionController } = Engine.context;
        await query(TransactionController.ethQuery, 'blockNumber', []);
        props.setInfuraAvailabilityNotBlocked();
      } catch (e) {
        if (e.message === AppConstants.ERRORS.INFURA_BLOCKED_MESSAGE) {
          props.navigation.navigate('OfflineModeView');
          props.setInfuraAvailabilityBlocked();
        }
      }
    } else {
      props.setInfuraAvailabilityNotBlocked();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.navigation,
    props.providerType,
    props.setInfuraAvailabilityBlocked,
    props.setInfuraAvailabilityNotBlocked,
  ]);

  const handleAppStateChange = useCallback(
    (appState) => {
      const newModeIsBackground = appState === 'background';
      // If it was in background and it's not anymore
      // we need to stop the Background timer
      if (backgroundMode.current && !newModeIsBackground) {
        BackgroundTimer.stop();
      }

      backgroundMode.current = newModeIsBackground;

      // If the app is now in background, we need to start
      // the background timer, which is less intense
      if (backgroundMode.current) {
        removeNotVisibleNotifications();
      }
    },
    [backgroundMode, removeNotVisibleNotifications],
  );

  const initForceReload = () => {
    // Force unmount the webview to avoid caching problems
    setForceReload(true);
    setTimeout(() => {
      setForceReload(false);
    }, 1000);
  };

  const renderLoader = () => (
    <View style={styles.loader}>
      <ActivityIndicator size="small" />
    </View>
  );

  const toggleRemindLater = () => {
    setShowRemindLaterModal(!showRemindLaterModal);
  };

  const toggleSkipCheckbox = () => {
    setSkipCheckbox(!skipCheckbox);
  };

  const skipAccountModalSecureNow = () => {
    toggleRemindLater();
    props.navigation.navigate('SetPasswordFlow', {
      screen: 'AccountBackupStep1B',
      params: { ...props.route.params },
    });
  };

  const skipAccountModalSkip = () => {
    if (skipCheckbox) toggleRemindLater();
  };

  /**
   * Current network
   */
  const providerConfig = useSelector(selectProviderConfig);
  const previousProviderConfig = useRef(undefined);
  const { toastRef } = useContext(ToastContext);

  // Show network switch confirmation.
  useEffect(() => {
    if (
      previousProviderConfig.current &&
      (providerConfig.chainId !== previousProviderConfig.current.chainId ||
        providerConfig.type !== previousProviderConfig.current.type)
    ) {
      const { type, chainId } = providerConfig;
      const networkImage = getNetworkImageSource({
        networkType: type,
        chainId,
      });
      const networkName = getNetworkNameFromProviderConfig(providerConfig);
      toastRef?.current?.showToast({
        variant: ToastVariants.Network,
        labelOptions: [
          {
            label: `${networkName} `,
            isBold: true,
          },
          { label: strings('toast.now_active') },
        ],
        networkName,
        networkImageSource: networkImage,
      });
    }
    previousProviderConfig.current = providerConfig;
  }, [providerConfig, toastRef]);

  useEffect(() => {
    if (locale.current !== I18n.locale) {
      locale.current = I18n.locale;
      initForceReload();
      return;
    }
  });

  // Remove all notifications that aren't visible
  useEffect(() => {
    removeNotVisibleNotifications();
  }, [removeNotVisibleNotifications]);

  useEffect(() => {
    const appStateListener = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    PushNotification.configure({
      requestPermissions: false,
      onNotification: (notification) => {
        let data = null;
        if (Device.isAndroid()) {
          if (notification.tag) {
            data = JSON.parse(notification.tag);
          }
        } else if (notification.data) {
          data = notification.data;
        }
        if (data && data.action === 'tx') {
          if (data.id) {
            NotificationManager.setTransactionToView(data.id);
          }
          props.navigation.navigate('TransactionsHome');
        }

        if (Device.isIos()) {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },
    });

    setTimeout(() => {
      NotificationManager.init({
        navigation: props.navigation,
        showTransactionNotification: props.showTransactionNotification,
        hideCurrentNotification: props.hideCurrentNotification,
        showSimpleNotification: props.showSimpleNotification,
        removeNotificationById: props.removeNotificationById,
      });
      checkInfuraAvailability();
      removeConnectionStatusListener.current = NetInfo.addEventListener(
        connectionChangeHandler,
      );
    }, 1000);

    return function cleanup() {
      appStateListener.remove();
      removeConnectionStatusListener.current &&
        removeConnectionStatusListener.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkLineaMainnetAvailability = useCallback(async () => {
    if (props.providerType === LINEA_MAINNET) {
      try {
        await jsonRpcRequest(LINEA_MAINNET_RPC_URL, 'eth_blockNumber', []);
      } catch (e) {
        setShowLineaMainnetAlert(true);
      }
    }
  }, [props.providerType]);

  useEffect(() => {
    checkLineaMainnetAvailability();
  }, [checkLineaMainnetAvailability]);

  const termsOfUse = useCallback(async () => {
    if (props.navigation) {
      await navigateTermsOfUse(props.navigation.navigate);
    }
  }, [props.navigation]);

  useEffect(() => {
    termsOfUse();
  }, [termsOfUse]);

  const renderLineaMainnetAlert = (networkType) => {
    if (networkType === LINEA_MAINNET && showLineaMainnetAlert) {
      return (
        <WarningAlert
          text={strings('networks.linea_mainnet_not_released_alert')}
          dismissAlert={() => setShowLineaMainnetAlert(false)}
        />
      );
    }
  };

  return (
    <React.Fragment>
      <View style={styles.flex}>
        {!forceReload ? (
          <MainNavigator navigation={props.navigation} />
        ) : (
          renderLoader()
        )}
        <GlobalAlert />
        <FadeOutOverlay />
        <Notification navigation={props.navigation} />
        <RampOrders />
        <SwapsLiveness />
        <BackupAlert
          onDismiss={toggleRemindLater}
          navigation={props.navigation}
        />
        {renderLineaMainnetAlert(props.providerType)}

        <SkipAccountSecurityModal
          modalVisible={showRemindLaterModal}
          onCancel={skipAccountModalSecureNow}
          onConfirm={skipAccountModalSkip}
          skipCheckbox={skipCheckbox}
          toggleSkipCheckbox={toggleSkipCheckbox}
        />
        <ProtectYourWalletModal navigation={props.navigation} />
        <RootRPCMethodsUI navigation={props.navigation} />
      </View>
    </React.Fragment>
  );
};

Main.router = MainNavigator.router;

Main.propTypes = {
  /**
   * Object that represents the navigator
   */
  navigation: PropTypes.object,
  /**
   * Dispatch showing a transaction notification
   */
  showTransactionNotification: PropTypes.func,
  /**
   * Dispatch showing a simple notification
   */
  showSimpleNotification: PropTypes.func,
  /**
   * Dispatch hiding a transaction notification
   */
  hideCurrentNotification: PropTypes.func,
  removeNotificationById: PropTypes.func,
  /**
   * Indicates whether third party API mode is enabled
   */
  thirdPartyApiMode: PropTypes.bool,
  /**
   * Network provider type
   */
  providerType: PropTypes.string,
  /**
   * Dispatch infura availability blocked
   */
  setInfuraAvailabilityBlocked: PropTypes.func,
  /**
   * Dispatch infura availability not blocked
   */
  setInfuraAvailabilityNotBlocked: PropTypes.func,
  /**
   * Remove not visible notifications from state
   */
  removeNotVisibleNotifications: PropTypes.func,
  /**
   * Object that represents the current route info like params passed to it
   */
  route: PropTypes.object,
};

const mapStateToProps = (state) => ({
  thirdPartyApiMode: state.privacy.thirdPartyApiMode,
  providerType: selectProviderType(state),
});

const mapDispatchToProps = (dispatch) => ({
  showTransactionNotification: (args) =>
    dispatch(showTransactionNotification(args)),
  showSimpleNotification: (args) => dispatch(showSimpleNotification(args)),
  hideCurrentNotification: () => dispatch(hideCurrentNotification()),
  removeNotificationById: (id) => dispatch(removeNotificationById(id)),
  setInfuraAvailabilityBlocked: () => dispatch(setInfuraAvailabilityBlocked()),
  setInfuraAvailabilityNotBlocked: () =>
    dispatch(setInfuraAvailabilityNotBlocked()),
  removeNotVisibleNotifications: () =>
    dispatch(removeNotVisibleNotifications()),
});

const ConnectedMain = connect(mapStateToProps, mapDispatchToProps)(Main);

const MainFlow = () => (
  <Stack.Navigator
    initialRouteName={'Main'}
    mode={'modal'}
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: importedColors.transparent },
    }}
  >
    <Stack.Screen name={'Main'} component={ConnectedMain} />
    <Stack.Screen
      name={'ReviewModal'}
      component={ReviewModal}
      options={{ animationEnabled: false }}
    />
  </Stack.Navigator>
);

export default MainFlow;
