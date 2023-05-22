import { Dataset, Log, sleep } from "crawlee";
import { Page } from "puppeteer";
import { DynamicTreeExplorer } from "./choice.js";

export type ScraperConfig = {
  page: Page;
  logger: Log;
};

export abstract class FairworkInteractiveScraper {
  static SELECTORS = {
      shared: {
          next_button:
              "body > div.container-fluid > div > div.right-col.col-md-9 > div.inner-wrapper > div > div > form:nth-child(1) > div.progress-group > ul > li.pos-right > button",
      },
      stage_1: {},
      stage_2: {
          select_option: "#know",
          next_button:
              "body > div.container-fluid > div > div.right-col.col-md-9 > div.inner-wrapper > div > div > form:nth-child(1) > div.progress-group > ul > li.pos-right > button",
      },
      stage_3: {
          award_list:
              "body > div.container-fluid > div > div.right-col.col-md-9 > div.inner-wrapper > div > div > form:nth-child(1) > fieldset > div.award-container.clearfix > div.radio-panel",
          award: {
              select: "input.award-option",
              title: "label",
          },
      },
      stage_4: {},
      stage_5: {
          classification_list:
              "body > div.container-fluid > div > div.right-col.col-md-9 > div.inner-wrapper > div > div > form:nth-child(1) > fieldset > div.classifcation-container.clearfix > div.radio-panel",
          class: {
              select: "input.classification-option",
              title: "label",
          },
      },
      stage_6: {
          always_casual: "#Casual",
      },
      stage_7: {
          age_list:
              "#opa-questions > div > div.aet-searchcontrol-container.clearfix > fieldset > div.radio-panel",
          age: {
              select: "input",
              title: "label",
          },
      },
      stage_8: {
          level_list:
              "#opa-questions > div > div.aet-searchcontrol-container.clearfix > fieldset > div.radio-panel",
          level: {
              select: "input",
              title: "label",
          },
      },
      specific_stage_8_5: {
          question_text: "#opa-questions > div > fieldset > legend > div > p",
          answers: "#opa-questions > div > fieldset > input",
      },
      stage_9: {
          select_penalties:
              "#ag-collapse_0 > div:nth-child(5) > div > table > tbody > tr > td:nth-child(2) > a",
          select_all: "#select-all-top",
          i_know_this_applies:
              "body > div.container-fluid > div > div.right-col.col-md-9 > div.inner-wrapper > div > div > form > div.btn-group.hidden-md.hidden-lg > button:nth-child(2)",
          penalty_list:
              "#ag-collapse_0 > div:nth-child(5) > div > table > tbody > tr",
          penalty: {
              name: "td.details",
              hourly_rate: "td.value",
          },
          base_rate: "#ag-collapse_0 > div:nth-child(1) > div > span",
      },
  } as const;
  protected page: Page;
  protected logger: Log;

  constructor(scraper_config: ScraperConfig) {
      const { page, logger } = scraper_config;

      this.page = page;
      this.logger = logger;
  }

  protected async click(selector: string) {
      if (!this.page) return;
      await this.page
          .waitForSelector(selector)
          .then(async () => {
              if (!this.page) return;
              await this.page
                  .click(selector, {
                      delay: Math.random() * 100 + 100,
                  })
                  .then(() => {
                      this.logger.info(`Clicked on [${selector}].`);
                  })
                  .catch((error) => {
                      this.logger.error(`${error} | ${this.page!.url()}`);
                  });
          })
          .catch(() => {
              this.logger.error(`Timeout waiting for element [${selector}].`);
          });
  }

  protected async getText(
      selector: string,
      parser?: (text: string) => string
  ) {
      if (!this.page) return "";
      const text = await this.page
          .$eval(selector, (el) => {
              return el.textContent || "";
          })
          .catch((error) => {
              this.logger.error(`${error} | ${this.page!.url()}`);
              return "";
          });
      this.logger.info(`Extracted text [${text}] from [${selector}].`);
      if (parser) {
          return parser(text);
      }
      return text;
  }

  protected async selectFromListingBasedOnValue(
      selector: string,
      value: string
  ) {
    const option = `${selector}[value='${value}']`
    this.logger.info(`Selected option [${option}]`)
    await this.click(
      option
    )
  }

  protected async clickNext() {
      await this.click(FairworkInteractiveScraper.SELECTORS.shared.next_button);
      this.logger.info('Moving to next stage ...')
      await this.page.waitForNavigation();
  }

  protected async getValuesFromListing(
      selector: string,
      parser?: (_: string) => string
  ) {
      if (!this.page) return [];
      const values = await this.page
          .$$eval(selector, (els) => {
              let awards = [];

              for (const el of els) {
                  awards.push(el.getAttribute("value") || "");
              }

              return awards;
          })
          .catch((error) => {
              this.logger.error(`${error} | ${this.page!.url()}`);
              return [];
          });

      this.logger.info(`Extracted values [${values}] from [${selector}].`);
      if (parser) {
          return values.map((value) => parser(value));
      }
      return values;
  }
}

export class ExhaustiveAwardScrapper extends FairworkInteractiveScraper {

  private award: string;
  state: DynamicTreeExplorer<{ class: null; age: null; }, Record<"class" | "age" , string | null>>;

    constructor(page: Page, logger: Log, award: string) {
        super({ page, logger });
        this.award = award
        this.state = new DynamicTreeExplorer({
          class: null,
          age: null
        })

        this.state.current_choices.class = 'Aboriginal and/or Torres Strait Islander Health Worker / Community Health Worker - Grade 1 - level 1'
        this.state.current_choices.age = '16 years of age or under'
    }

    private get age(){
      return this.state.current_choices.age!
    }

    private get class(){
      return this.state.current_choices.class!
    }

    public async run() {
        const SELECTORS = FairworkInteractiveScraper.SELECTORS;
        for (const stage of Object.keys(SELECTORS)) {
            if (stage !== "shared")
                this.logger.info(`Currently at ${stage.replace("_", " ")}`);
            switch (stage as keyof typeof SELECTORS) {
                case "shared":
                    break;

                case "stage_2": {
                    await this.click(SELECTORS.stage_2.select_option);
                    await this.clickNext();
                    break
                }
                case "stage_3": {
                    await this.selectFromListingBasedOnValue(
                      SELECTORS.stage_3.award_list+' > '+SELECTORS.stage_3.award.select,
                      this.award
                    );
                    await this.clickNext();
                    break
                }
                case "stage_5": {
                    await this.selectFromListingBasedOnValue(
                      SELECTORS.stage_5.classification_list+' > '+SELECTORS.stage_5.class.select,
                      this.class
                      );
                    await this.clickNext();
                    break
                }
                case "stage_6": {
                    await this.click(SELECTORS.stage_6.always_casual);
                    await this.clickNext();
                    break
                }
                case "stage_7": {
                    await this.selectFromListingBasedOnValue(
                      SELECTORS.stage_7.age_list+' > '+SELECTORS.stage_7.age.select,
                      this.age
                    );
                    await this.clickNext();
                    break
                }
                case "stage_8": {
                    break;
                }
                case "specific_stage_8_5": {
                    break;
                }
                case "stage_9": {
                    await this.click(SELECTORS.stage_9.select_penalties);
                    await this.page.waitForNavigation()
                    await this.click(SELECTORS.stage_9.select_all);
                    await this.click(SELECTORS.stage_9.i_know_this_applies);
                    await this.page.waitForNavigation()
                    await sleep(1000*1000)
                    break
                }
                default: {
                    await this.clickNext();
                }
            }
        }
    }
}

export class AwardScraper extends FairworkInteractiveScraper {
    constructor(page: Page, logger: Log) {
        super({ page, logger });
    }

    public async run() {

        const { shared, stage_1, stage_2, stage_3 } = FairworkInteractiveScraper.SELECTORS
        const SELECTORS = {
          shared, stage_1, stage_2, stage_3
        }
        for (const stage of Object.keys(SELECTORS)) {
            if (stage !== "shared")
                this.logger.info(`Currently at ${stage.replace("_", " ")}`);

            switch (stage as keyof typeof SELECTORS) {
                case "shared":
                    break;

                case "stage_2": {
                    await this.click(SELECTORS.stage_2.select_option);
                    await this.clickNext();
                    break;
                }
                case "stage_3": {
                    const awards = await this.getValuesFromListing(
                        SELECTORS.stage_3.award_list +
                            " > " +
                            SELECTORS.stage_3.award.select
                    );

                    Dataset.pushData({ awards });
                    break;
                }
                default: {
                    await this.clickNext();
                }
            }
        }
    }
}
