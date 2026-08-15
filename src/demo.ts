import { mountVimDojo } from './index';

const app = document.getElementById('app');
if (!app) throw new Error('Missing #app');

mountVimDojo(app, { basePath: '/' });
