import { createPuppeteerRouter } from 'crawlee';
import { ExhaustiveAwardScrapper } from './components/scraper.js';

export const router = createPuppeteerRouter();

router.addDefaultHandler(async ({ page, log }) => {

    await new ExhaustiveAwardScrapper(page, log, 'MA000115').run()
    //await new AwardScrapper(page, log).run()
});
