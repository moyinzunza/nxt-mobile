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
import { TEST_DAPP_URL, TestDApp } from '../../pages/TestDApp';
import root from '../../../locales/languages/en.json';

const SENT_COLLECTIBLE_MESSAGE_TEXT = root.transactions.sent_collectible;
const validAccount = Accounts.getValidAccount();
const ERC20_ADDRESS = '0xE2B0CA120008b83e27687c38b46BEA4F5FEcfA61';

describe(Regression('sendERC20 tokens test'), () => {
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

  it('Send an ERC20 token', async () => {
    // Setup
    await importWalletWithRecoveryPhrase();
    await addLocalhostNetwork();

    // Navigate to the browser screen
    await TabBarComponent.tapBrowser();

    // Navigate to the ERC20 url
    await TestDApp.navigateToErc721Contract(TEST_DAPP_URL, ERC20_ADDRESS);

    // Connect account
    await TestDApp.connect();

    // Transfer ERC20 tokens
    await TestDApp.tapTransferFromButton(ERC20_ADDRESS);
    await TestHelpers.delay(3000);

    await TestDApp.tapConfirmButton();

    // Navigate to the activity screen
    await TabBarComponent.tapActivity();

    // Assert ERC20 tokens are sent
    await TestHelpers.checkIfElementByTextIsVisible(
      SENT_COLLECTIBLE_MESSAGE_TEXT,
    );
  });
});
