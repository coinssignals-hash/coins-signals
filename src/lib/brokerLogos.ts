// Static imports for broker logos
import pepperstone from '@/assets/brokers/pepperstone.png';
import icMarkets from '@/assets/brokers/ic-markets.png';
import xtb from '@/assets/brokers/xtb.png';
import avatrade from '@/assets/brokers/avatrade.png';
import xmGroup from '@/assets/brokers/xm-group.png';
import fpMarkets from '@/assets/brokers/fp-markets.png';
import exness from '@/assets/brokers/exness.png';
import etoro from '@/assets/brokers/etoro.png';
import plus500 from '@/assets/brokers/plus500.png';
import oanda from '@/assets/brokers/oanda.png';
import igGroup from '@/assets/brokers/ig-group.png';
import interactiveBrokers from '@/assets/brokers/interactive-brokers.png';
import saxoBank from '@/assets/brokers/saxo-bank.png';
import fxcm from '@/assets/brokers/fxcm.png';
import capitalCom from '@/assets/brokers/capital-com.png';
import tickmill from '@/assets/brokers/tickmill.png';
import admirals from '@/assets/brokers/admirals.png';
import hfm from '@/assets/brokers/hfm.png';
import roboforex from '@/assets/brokers/roboforex.png';
import swissquote from '@/assets/brokers/swissquote.png';
import fxtm from '@/assets/brokers/fxtm.png';
import cmcMarkets from '@/assets/brokers/cmc-markets.png';
import tdAmeritrade from '@/assets/brokers/td-ameritrade.png';
import charlesSchwab from '@/assets/brokers/charles-schwab.png';
import degiro from '@/assets/brokers/degiro.png';
import vantage from '@/assets/brokers/vantage.png';

/**
 * Map of broker name patterns to their logo imports.
 * Keys are lowercase substrings matched against broker.name.toLowerCase()
 */
const LOGO_MAP: Record<string, string> = {
  pepperstone,
  'ic markets': icMarkets,
  'ic market': icMarkets,
  xtb,
  avatrade,
  'ava trade': avatrade,
  'xm group': xmGroup,
  'xm ': xmGroup,
  'fp markets': fpMarkets,
  exness,
  etoro,
  'e-toro': etoro,
  plus500,
  'plus 500': plus500,
  oanda,
  'ig group': igGroup,
  'ig markets': igGroup,
  'interactive brokers': interactiveBrokers,
  'saxo bank': saxoBank,
  saxo: saxoBank,
  fxcm,
  'capital.com': capitalCom,
  tickmill,
  admirals,
  'admiral markets': admirals,
  hfm,
  'hf markets': hfm,
  'hotforex': hfm,
  roboforex,
  swissquote,
  fxtm,
  forextime: fxtm,
  'cmc markets': cmcMarkets,
  'cmc market': cmcMarkets,
  'td ameritrade': tdAmeritrade,
  'charles schwab': charlesSchwab,
  schwab: charlesSchwab,
  degiro,
  vantage,
  'vantage fx': vantage,
};

/**
 * Returns the logo URL for a broker name, or undefined if not found.
 */
export function getBrokerLogo(brokerName: string): string | undefined {
  const lower = brokerName.toLowerCase();
  for (const [pattern, logo] of Object.entries(LOGO_MAP)) {
    if (lower.includes(pattern)) return logo;
  }
  return undefined;
}
