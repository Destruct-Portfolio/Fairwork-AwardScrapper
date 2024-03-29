export namespace DataN {
    export type EntryT = {
        award: string,
        level: string,
        age: string,
        award_question: string,
        award_answer: string,
        hourly_rate: string,
        penalties: {
            name: string,
            rate: string
        }[]
    }
}