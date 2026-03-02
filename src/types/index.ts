export interface Flashcard {
    id: string;
    question: string;
    answer: string;
    deckId: string;
}

export interface Deck {
    id: string;
    title: string;
    description?: string;
    flashcards: Flashcard[];
}