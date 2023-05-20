import { Dataset, createPuppeteerRouter } from 'crawlee';
import { StatefulInteractiveScrapper } from './components/scraper.js';

export const router = createPuppeteerRouter();

router.addDefaultHandler(async ({ page, log }) => {

    await new StatefulInteractiveScrapper(page, log).run()
    
});
