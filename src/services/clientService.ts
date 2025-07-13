
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import type { Client, Note } from '@/types';

const clientsCollection = collection(db, 'clients');

const toClientObject = (doc: any): Client => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        notes: data.notes?.map((note: any) => ({
            ...note,
            createdAt: note.createdAt?.toDate ? note.createdAt.toDate().toISOString() : note.createdAt
        })) || [],
    };
};

export const getClients = async (): Promise<Client[]> => {
    const snapshot = await getDocs(clientsCollection);
    return snapshot.docs.map(toClientObject);
};

export const addClient = async (clientData: Omit<Client, 'id'>): Promise<Client> => {
    const dataToSave = { ...clientData };
    if (dataToSave.notes && dataToSave.notes.length > 0) {
        dataToSave.notes = dataToSave.notes.map(note => {
            const createdAtDate = new Date(note.createdAt);
            return {
                ...note,
                createdAt: Timestamp.fromDate(createdAtDate)
            };
        });
    }
    const docRef = await addDoc(clientsCollection, dataToSave);
    return { id: docRef.id, ...clientData };
};

export const updateClient = async (id: string, clientData: Partial<Client>): Promise<void> => {
    const clientDoc = doc(db, 'clients', id);
    const dataToUpdate: { [key: string]: any } = { ...clientData };

    if (dataToUpdate.notes && dataToUpdate.notes.length > 0) {
        dataToUpdate.notes = dataToUpdate.notes.map(note => {
            if (note.createdAt && typeof note.createdAt === 'string') {
                return {
                    ...note,
                    createdAt: Timestamp.fromDate(new Date(note.createdAt))
                };
            }
            return note;
        });
    }

    await updateDoc(clientDoc, dataToUpdate);
};

export const deleteClient = async (id: string): Promise<void> => {
    const clientDoc = doc(db, 'clients', id);
    await deleteDoc(clientDoc);
};
