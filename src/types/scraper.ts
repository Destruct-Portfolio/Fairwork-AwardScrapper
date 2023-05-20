import { DataN } from "./dataset"

export namespace ScraperN {
    export type StateT = {
        previous_choice: ChoiceT | null,
        actual_choice: ChoiceT
    }

    export type ChoiceT = {
        age: string,
        award: string,
        level: string,
        class: string
    }
    export type PayloadT = DataN.EntryT
}