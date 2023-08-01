'use strict';

import { Regression } from '../../tags';
import TestHelpers from '../../helpers';
import {
  importWalletWithRecoveryPhrase,
  addLocalhostNetwork,
} from '../../viewHelper';
import TabBarComponent from '../../pages/TabBarComponent';
import Accounts from '../../../wdio/helpers/Accounts';
import Ganache from '../../../app/util/test/ganache';
import Browser from '../../pages/Drawer/Browser';
import ConnectModal from '../../pages/modals/ConnectModal';
import { TEST_DAPP_URL } from '../../pages/TestDApp';
import root from '../../../locales/languages/en.json';

const validAccount = Accounts.getValidAccount();
const ERC721_ADDRESS = '0x26D6C3e7aEFCE970fe3BE5d589DbAbFD30026924';

describe(Regression('Send an ERC721 token'), () => {
  let ganacheServer;
  beforeAll(async () => {
    jest.setTimeout(150000);
    if (device.getPlatform() === 'android') {
      await device.reverseTcpPort('8081'); // because on android we need to expose the localhost ports to run ganache
      await device.reverseTcpPort('8545');
    }
    ganacheServer = new Ganache();
    await ganacheServer.start({ mnemonic: validAccount.seedPhrase });
  });

  afterAll(async () => {
    await ganacheServer.quit();
  });

  it('should go to send view', async () => {
    await importWalletWithRecoveryPhrase();

    await addLocalhostNetwork();

    await TabBarComponent.tapBrowser();

    await Browser.navigateToErc721Contract(TEST_DAPP_URL, ERC721_ADDRESS);
    await TestHelpers.delay(1500);

    await Browser.tapConnectButton();
    await ConnectModal.tapConnectButton();
    await TestHelpers.delay(1500);

    await Browser.tapTransferFromButton();

    await TabBarComponent.tapActivity();

    await TestHelpers.checkIfElementByTextIsVisible(
      root.transactions.sent_collectible,
    );
  });
});
