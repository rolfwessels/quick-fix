import { defineConfig, globalIgnores } from 'eslint/config';
import raycastConfig from '@raycast/eslint-config';

export default defineConfig([globalIgnores(['src/vendor/cursor-sdk.js']), ...raycastConfig]);
