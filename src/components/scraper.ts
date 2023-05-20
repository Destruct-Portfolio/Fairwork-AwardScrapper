import { Log, sleep } from "crawlee";
import { Page } from "puppeteer";

export class StatefulInteractiveScrapper {

    static SELECTORS = {
        shared: {
          next_button: "body > div.container-fluid > div > div.right-col.col-md-9 > div.inner-wrapper > div > div > form:nth-child(1) > div.progress-group > ul > li.pos-right > button"
        },
        stage_1: {},
        stage_2: {
            select_option: "#know",
            next_button: "body > div.container-fluid > div > div.right-col.col-md-9 > div.inner-wrapper > div > div > form:nth-child(1) > div.progress-group > ul > li.pos-right > button"
        },
        stage_3: {
            award_list: "body > div.container-fluid > div > div.right-col.col-md-9 > div.inner-wrapper > div > div > form:nth-child(1) > fieldset > div.award-container.clearfix > div.radio-panel",
            award: {
                select:"input",
                title: "label"
            }
        },
        stage_4: {},
        stage_5: {
            classification_list: 'body > div.container-fluid > div > div.right-col.col-md-9 > div.inner-wrapper > div > div > form:nth-child(1) > fieldset > div.classifcation-container.clearfix > div.radio-panel',
            class: {
                select: "input",
                title: "label"
            }
        },
        stage_6: {
            always_casual: "#Casual"
        },
        stage_7: {
            age_list: "#opa-questions > div > div.aet-searchcontrol-container.clearfix > fieldset > div.radio-panel",
            age: {
                select: "input",
                title: "label"
            }
        },
        stage_8: {
          level_list: '#opa-questions > div > div.aet-searchcontrol-container.clearfix > fieldset > div.radio-panel',
          level: {
            select: 'input',
            title: 'label'
          }
        },
        specific_stage_8_5: {
            question_text: '#opa-questions > div > fieldset > legend > div > p',
            answers: '#opa-questions > div > fieldset > input'
        },
        stage_9: {
            select_penalties: '#ag-collapse_0 > div:nth-child(5) > div > table > tbody > tr > td:nth-child(2) > a',
            select_all: '#select-all-top',
            i_know_this_applies: 'body > div.container-fluid > div > div.right-col.col-md-9 > div.inner-wrapper > div > div > form > div.btn-group.hidden-md.hidden-lg > button:nth-child(2)',
            penalty_list: '#ag-collapse_0 > div:nth-child(5) > div > table > tbody > tr',
            penalty: {
                name: 'td.details',
                hourly_rate: 'td.value'
            },
            base_rate: '#ag-collapse_0 > div:nth-child(1) > div > span'
        }
    } as const

    private _page: Page;
    private _logger: Log;
  private _state: {};
    constructor(page: Page, log: Log){
        this._page = page
        this._logger = log
        this._state = {
          
        }
    }

    private get page(){
        return this._page
    }

    private get logger(){
        return this._logger
    }

    private async click(selector: string) {
        if (!this.page) return;
        await this.page
          .waitForSelector(selector)
          .then(async () => {
            if (!this.page) return;
            await this.page.click(selector, {
              delay: Math.random() * 100 + 100,
            })
              .then(()=>{
                this.logger.info(`Clicked on [${selector}].`);
              })
              .catch((error)=>{
                this.logger.error(`${error} | ${this.page!.url()}`)
              })
          })
          .catch(() => {
            this.logger.error(`Timeout waiting for element [${selector}].`);
          });
    }

    private async getText(selector: string, parser?: (text: string)=>string) {
        if (!this.page) return "";
        const text = await this.page.$eval(selector, (el) => {
          return el.textContent || '';
        })
          .catch((error)=>{
            this.logger.error(`${error} | ${this.page!.url()}`)
            return ""
          })
        this.logger.info(`Extracted text [${text}] from [${selector}].`);
        if(parser) {
          return parser(text)
        }
        return text;
    }

    private async getValue(selector: string, parser?: (text: string)=>string) {
        if (!this.page) return "";
        const text = await this.page.$eval(selector, (el) => {
          return el.getAttribute('value') || '';
        })
          .catch((error)=>{
            this.logger.error(`${error} | ${this.page!.url()}`)
            return ""
          })
        this.logger.info(`Extracted text [${text}] from [${selector}].`);
        if(parser) {
          return parser(text)
        }
        return text;
    }

    public async run(){
        const SELECTORS = StatefulInteractiveScrapper.SELECTORS
        for(const stage of Object.keys(SELECTORS)){
          if(stage!=='shared') this.logger.info(`Currently at ${stage.replace('_', ' ')}`)
          switch(stage as keyof typeof SELECTORS){
            case 'shared': break;

            case 'stage_2': {
              await this.click(SELECTORS.stage_2.select_option)
            }
            case 'stage_3': {
              await this.click(SELECTORS.stage_3.award_list)

            }
            case 'stage_5': {
              await this.click(SELECTORS.stage_5.classification_list)
            }
            case 'stage_6': {
              await this.click(SELECTORS.stage_6.always_casual)
            }
            case 'stage_7': {
              await this.click(SELECTORS.stage_7.age_list)
            }
            case 'stage_8': {
              await this.click(SELECTORS.stage_8.level_list)
            }
            case 'specific_stage_8_5': {

            }
            case 'stage_9': {
              await this.click(SELECTORS.stage_9.select_penalties)
              await this.click(SELECTORS.stage_9.select_all)
              await this.click(SELECTORS.stage_9.i_know_this_applies)
              break;
            }
            default:{
              await this.click(SELECTORS.shared.next_button)
            }
          }
        }

    }
}