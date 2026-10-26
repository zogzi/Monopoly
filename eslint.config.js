import tseslint from 'typescript-eslint';
export default tseslint.config({ignores:['dist/**','node_modules/**','artifacts/**','test-results/**']},...tseslint.configs.recommended);
