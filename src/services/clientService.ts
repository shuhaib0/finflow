
import { db } from '@/lib/firebase/client';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import type { Client } from '@/types';

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

export const getClients = async (userId: string): Promise<Client[]> => {
    const q = query(clientsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toClientObject);
};

export const findClientByName = async (userId: string, name: string): Promise<Client | null> => {
    const q = query(clientsCollection, where("userId", "==", userId), where("name", "==", name));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    return toClientObject(snapshot.docs[0]);
}

export const addClient = async (clientData: Omit<Client, 'id'>): Promise<Client> => {
    const dataToSave: { [key: string]: any } = { ...clientData };
    
    if (dataToSave.notes && dataToSave.notes.length > 0) {
        dataToSave.notes = dataToSave.notes.map((note: any) => ({
            ...note,
            createdAt: Timestamp.fromDate(new Date(note.createdAt))
        }));
    } else {
        dataToSave.notes = [];
    }

    const docRef = await addDoc(clientsCollection, dataToSave);
    
    return { 
        ...clientData,
        id: docRef.id,
    };
};

export const updateClient = async (id: string, clientData: Partial<Omit<Client, 'id' | 'userId'>>): Promise<void> => {
    const clientDoc = doc(db, 'clients', id);
    const dataToUpdate: { [key: string]: any } = { ...clientData };

    if (dataToUpdate.notes && dataToUpdate.notes.length > 0) {
        dataToUpdate.notes = dataToUpdate.notes.map((note: any) => {
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
