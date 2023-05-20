type OptionsT = Array<string>
type ChoiceT = string


class DynamicTreeExplorer<OptionStagesT extends Record<string, OptionsT | null> = Record<string, OptionsT | null>, StageChoicesT extends Record<keyof OptionStagesT, ChoiceT | null> = Record<keyof OptionStagesT, ChoiceT | null>>{

    option_listings: OptionStagesT
    current_choices: StageChoicesT

    shouldBeExploring: boolean
    optionStage: keyof OptionStagesT | null
    stages: string[]
    first_stage: keyof OptionStagesT
    last_stage: keyof OptionStagesT
    isExhausted: boolean

    constructor(remaining_options: OptionStagesT){

        this.stages = Object.keys(remaining_options)
        this.first_stage = this.stages[0] as keyof typeof remaining_options
        this.last_stage = this.stages[this.stages.length-1] as keyof typeof remaining_options
        this.option_listings = { ...remaining_options }
        this.current_choices = { ...remaining_options } as unknown as StageChoicesT

        this.shouldBeExploring = true
        this.isExhausted = false
        this.optionStage = null
    }

    public explore(listing: OptionsT){

        if(this.isExhausted) return;
        const current_stage_index = this.optionStage? 
            this.stages.indexOf(this.optionStage as string):
            -1

        const next_stage = current_stage_index!==this.stages.length-1?
            this.stages[current_stage_index+1]:
            null
        if(next_stage){
            //@ts-ignore
            this.option_listings[next_stage] = listing
            //@ts-ignore
            this.current_choices[next_stage] = listing[0]
            this.stepForward()
        }

        if(this.optionStage===this.last_stage) this.shouldBeExploring = false;
    }

    // horizontal cursor
    private stepBack(){
        const current_stage_index = this.stages.indexOf(this.optionStage as string)
        //@ts-ignore
        this.option_listings[this.optionStage] = null
        //@ts-ignore
        this.current_choices[this.optionStage] = null

        if(current_stage_index > 0) {
            this.optionStage = this.stages[current_stage_index-1]
        }

        if(current_stage_index === 0) {
            this.optionStage = null
        }

        this.shouldBeExploring = true
    }
    
    private stepForward(){
        const current_stage_index = this.stages.indexOf(this.optionStage as string)
        if(current_stage_index < this.stages.length-1) {
            this.optionStage = this.stages[current_stage_index+1]
        } else {
            this.shouldBeExploring = false
        }
    }

    // vertical cursor
    public nextChoice(){

        if(this.isExhausted) return;
        const current_choice = this.current_choices[this.optionStage!]
        const choice_list = this.option_listings[this.optionStage!]!
        const index = choice_list.indexOf(current_choice!)
        if(this.optionStage===this.last_stage) this.shouldBeExploring = false;
        if(index < choice_list.length - 1) {
            //@ts-ignore
            this.current_choices[this.optionStage] = choice_list[index+1]
        }

        if(index === choice_list.length - 1) {
            if(this.optionStage===this.first_stage) return;

            this.stepBack()
            this.nextChoice()
        }

        this.isExhausted = this.exhaustionCheck()
    }

    private exhaustionCheck(){
        for(const stage of Object.keys(this.current_choices)) {
            const choice = this.current_choices[stage]
            if(!choice) return false;
            if(!this.option_listings[stage]) return false;
            if(this.option_listings[stage]!.indexOf(choice)!==this.option_listings[stage]!.length-1) {
                return false
            }
        }
        return true
    }
}