import AppConstants from 'app/core/AppConstants';
import { ACCOUNT_BALANCE_BY_ADDRESS_TEST_ID } from 'wdio/screen-objects/testIDs/Components/AccountListComponent.testIds';

function hasDecimals(separator: string, decimalPlaces: string) {
  return new RegExp(`^\\d+\\${separator}\\d{${decimalPlaces}}$`, 'g');
}

// NOTE: transition to object form like i18n?

export enum RegexEnums {
  account_balance,
  activation_key,
  address_with_spaces,
  color_black,
  decimal_string_migrations,
  decimal_string,
  default_account,
  ens_name,
  fractions,
  has_one_digit,
  hex_prefix,
  integer,
  local_network,
  name_initial,
  node_files,
  non_number,
  number,
  portfolio_url,
  prefixed_formatted_hex_string,
  private_credentials,
  replace_network_error_sentry,
  sanitize_url,
  seed_phrase,
  start_url,
  trailing_slash,
  trailing_zero,
  transaction_nonce,
  url_http_to_https,
  url,
  valid_chain_id_hex,
  valid_chain_id,
  wallet_address,
  white_spaces,
}

interface Curr {
  {[key: number]: RegExp, [key: number]: RegExp} 
}
interface Currencies {
  eth: Curr;
  usd: Curr;
}
type RETypes = RegexEnums & Currencies;

export const regex: RETypes = {
  eth: { 1: /1 ETH/, 2: /2 ETH/ },
  usd: { 3200: /\$3200/, 6400: /\$6400/ },
  account_balance: new RegExp(`${ACCOUNT_BALANCE_BY_ADDRESS_TEST_ID}`),
  activation_key: /^[a-zA-Z0-9\\-]{1,32}$/,
  address_with_spaces: /\s/g,
  color_black: /black/g,
  decimal_string: /[1-9]/,
  decimal_string_migrations: /^[1-9]\d*$/u,
  default_account: /^Account \d*$/,
  // Checks that the domain consists of at least one valid domain pieces separated by periods, followed by a tld
  // Each piece of domain name has only the characters a-z, 0-9, and a hyphen (but not at the start or end of chunk)
  // A chunk has minimum length of 1, but minimum tld is set to 2 for now (no 1-character tlds exist yet)
  ens_name:
    /^(?:[a-z0-9](?:[-a-z0-9]*[a-z0-9])?\.)+[a-z0-9][-a-z0-9]*[a-z0-9]$/u,
  fractions: /^([0-9]*[1-9]|0)(0*)/,
  has_one_digit: /^\d$/,
  hex_prefix: /^-?0x/u,
  integer: /^-?\d*(\.0+|\.)?$/,
  local_networkL:
    /(^127\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)/,
  name_initial: /[a-z]/i,
  // metro, metro-core, metro-source-map, metro-etc.
  node_files: new RegExp(['/metro(?:-[^/]*)?/'].join('|')),
  non_number: /[^0-9.]/g,
  number: /^(\d+(\.\d+)?)$/,
  portfolio_url: new RegExp(`${AppConstants.PORTFOLIO_URL}/(?![a-z])`),
  prefixed_formatted_hex_string: /^0x[1-9a-f]+[0-9a-f]*$/iu,
  private_credentials: /"/g,
  replace_network_error_sentry: /0x[A-Fa-f0-9]{40}/u,
  sanitize_url:
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gu,
  seed_phrase: /\w+/gu,
  start_url: /^www\./,
  trailing_slash: /\/+$/,
  trailing_zero: /\.?0+$/,
  transaction_nonce: /^#/,
  url: new RegExp(
    /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!&',;=.+]+$/g,
  ),
  url_http_to_https: /^http:\/\//,
  valid_chain_id: /^[0-9]+$/u,
  valid_chain_id_hex: /^0x[0-9a-f]+$/iu,
  wallet_address: /^(0x){1}[0-9a-fA-F]{40}$/i,
  white_spaces: /\s+/g,
};
