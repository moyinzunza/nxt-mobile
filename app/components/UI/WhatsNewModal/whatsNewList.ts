/* eslint-disable import/no-commonjs, import/prefer-default-export, @typescript-eslint/no-require-imports */
import { WhatsNew } from './types';

export const whatsNew: WhatsNew = {
  version: 0,
  disabled: false,
  onlyUpdates: true, // If true only users who updated the app will see the content. No new users will see the content.
  maxAppVersion: '6.4.0', // Only users with a version <= than this will see the content
  minAppVersion: '6.4.0', // Only users with a version >= than this will see the content
  /**
   * Slides utilizes a templating system in the form of a 2D array, which is eventually rendered within app/components/UI/WhatsNewModal/index.js.
   * The root layer determines the number of slides. Ex. To display 3 slides, the root layer should contain 3 arrays.
   * The inner layer determines the content that will be rendered within each slide.
   * The slide content takes the form of union types, where the possible types are `image`, `title`, `description`, or `button`.
   * Both slide count and slide content will be rendered in the same order as the data set.
   */
  slides: [],
};
