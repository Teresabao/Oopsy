export interface FlashcardModel {
    id: string;
    question: string;
    answer: string;
    deckId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface DeckModel {
    id: string;
    title: string;
    description: string;
    flashcards: FlashcardModel[];
    createdAt: Date;
    updatedAt: Date;
}

export function createFlashcard(data: Omit<FlashcardModel, 'id' | 'createdAt' | 'updatedAt'>): FlashcardModel {
    return {
        id: generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

export function createDeck(data: Omit<DeckModel, 'id' | 'createdAt' | 'updatedAt'>): DeckModel {
    return {
        id: generateId(),
        ...data,
        flashcards: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}