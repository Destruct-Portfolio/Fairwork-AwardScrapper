import { Dataset, Log, sleep } from "crawlee";
import { Page } from "puppeteer";
import { DynamicTreeExplorer } from "./choice.js";
import { DataN } from "../types/dataset.js";

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

  protected async exists(selector: string){
    if (!this.page) return false;
    const el = await this.page.$(selector)
    return !!el
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
                      this.logger.error(`${error} | While clicking on [${selector}] | ${this.page!.url()}`);
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

  protected async clickNext(skip_wait_for_navi?: boolean) {
      await this.click(FairworkInteractiveScraper.SELECTORS.shared.next_button);
      this.logger.info('Moving to next stage ...')
      if(skip_wait_for_navi) return;
      await this.page.waitForNavigation();
  }

  protected async getValuesFromListing(
      selector: string,
      parser?: (_: string) => string
  ) {
      if (!this.page) return [];
      const values = await this.page
          .$$eval(selector, (els) => {
              let values = [];

              for (const el of els) {
                  values.push(el.getAttribute("value") || "");
              }

              return values;
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

  protected async getKeyValueFromListing(
    list_selector: string,
    key_selector: string,
    value_selector: string
  ){

    if (!this.page) return [];
    const selectors =  {key_selector, value_selector}
    const values = await this.page
        .$$eval(list_selector, (els, selectors) => {
            let penalties: DataN.EntryT['penalties'] = [];

            for (const el of els) {
                const penalty_name = el.querySelector(selectors.key_selector)?.textContent || ''
                const penalty_rate = el.querySelector(selectors.value_selector)?.textContent || ''

                penalties.push({
                  name: penalty_name,
                  rate: penalty_rate
                })
            }

            return penalties;
        }, selectors)
        .catch((error) => {
            this.logger.error(`${error} | ${this.page!.url()}`);
            return [];
        });

    this.logger.info(`Extracted values [${values}] from [${list_selector}].`);

    return values;

  }
}

export class ExhaustiveAwardScrapper extends FairworkInteractiveScraper {

  private award: string;
  private state: DynamicTreeExplorer<{ class: null; age: null; }, Record<"class" | "age" , string | null>>;
  private payload: Partial<DataN.EntryT>

    constructor(page: Page, logger: Log, award: string) {
        super({ page, logger });
        this.award = award
        this.state = new DynamicTreeExplorer({
          class: null,
          age: null
        })

        this.payload = {}

    }

    private get age(){
      return this.state.current_choices.age!
    }

    private get class(){
      return this.state.current_choices.class!
    }

    public async run() {
        const SELECTORS = FairworkInteractiveScraper.SELECTORS;
        
        // stage 1
        this.logger.info('Stage 1')
        await this.clickNext(true);

        // stage 2 
        this.logger.info('Stage 2')
        await this.click(SELECTORS.stage_2.select_option);
        await this.clickNext(true);

        // stage 3
        this.logger.info('Stage 3')
        await this.selectFromListingBasedOnValue(
          SELECTORS.stage_3.award_list+' > '+SELECTORS.stage_3.award.select,
          this.award
        );
        await this.clickNext(true);
        this.payload.award = this.award

        // stage 4
        this.logger.info('Stage 4')
        await this.clickNext(true);

        // stage 5
        this.logger.info('Stage 5')

        if(!this.class) {
          const classes = await this.getValuesFromListing(SELECTORS.stage_5.classification_list+' > '+SELECTORS.stage_5.class.select)
          this.state.explore(classes)
        }

        await this.selectFromListingBasedOnValue(
          SELECTORS.stage_5.classification_list+' > '+SELECTORS.stage_5.class.select,
          this.class
          );
        await this.clickNext();
        this.payload.level

        // stage 6
        this.logger.info('Stage 6')
        await this.click(SELECTORS.stage_6.always_casual);
        await this.clickNext(true);

        // stage 7 
        this.logger.info('Stage 7')
        const ages = await this.getValuesFromListing(SELECTORS.stage_7.age_list)
        this.state.explore(ages)
        await this.selectFromListingBasedOnValue(
          SELECTORS.stage_7.age_list+' > '+SELECTORS.stage_7.age.select,
          this.age
        );
        await this.clickNext(true);
        this.payload.age = this.age

        // stage 8 - sometimes this shows
        this.logger.info('Stage 8')
        if(true) {
          await this.click(SELECTORS.stage_8.level_list)
          await this.clickNext();
        } else {
          this.logger.info('This will be skipped ...')
        }


        // stage 8.5 - award specific
        this.logger.info('Stage 8.5')
        this.logger.info('This will be skipped ...')

        // stage 9 - result page
        this.logger.info('Stage 9')
        await this.click(SELECTORS.stage_9.select_penalties);
        await this.click(SELECTORS.stage_9.select_all);
        await this.click(SELECTORS.stage_9.i_know_this_applies);
        await this.page.waitForNavigation()

        const hourly_rate = await this.getText(SELECTORS.stage_9.base_rate)
        const penalties = await this.getKeyValueFromListing(
          SELECTORS.stage_9.penalty_list,
          SELECTORS.stage_9.penalty.name,
          SELECTORS.stage_9.penalty.hourly_rate
        )

        this.payload.hourly_rate = hourly_rate
        this.payload.penalties = penalties

        Dataset.pushData(this.payload)

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
