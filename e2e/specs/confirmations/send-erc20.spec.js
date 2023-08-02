
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


/* Feature: Send an ERC20 token
  A user should be able to send an ERC20.
  @ganache
  @erc20
  Scenario: should successfully send an ERC20 token from a dapp
    Given I have imported my wallet
    And I tap No Thanks on the Enable security check screen
    And I tap No thanks on the onboarding welcome tutorial
    And Ganache network is selected
    When I navigate to the browser
    And I am on Home MetaMask website
    When I navigate to "test-dapp-erc20"
    And I connect my active wallet to the test dapp
    And I scroll to the ERC20 section
    And I transfer ERC20 tokens
    When I tap on the Activity tab option
    Then "Sent Tokens" transaction is displayed */


    describe(Regression('Send an ERC20 token'), () => {
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
          console.log( "<<<<< Recovery Phrase");
          it('should go to send view', async () => {
            await importWalletWithRecoveryPhrase();
        
            console.log( "<<<<< Add Ganache");
            await addLocalhostNetwork();

            //When I navigate to the browser
            console.log( "<<<<< Navigate to browser");
            await TabBarComponent.tapBrowser();

    await Browser.navigate(TEST_DAPP_URL, ERC20_ADDRESS);
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