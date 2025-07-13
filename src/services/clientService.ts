import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import type { Client, Note } from '@/types';

const clientsCollection = collection(db, 'clients');

const toClientObject = (doc: any): Client => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings
        notes: data.notes?.map((note: any) => ({
            ...note,
            createdAt: note.createdAt instanceof Timestamp ? note.createdAt.toDate().toISOString() : note.createdAt
        })) || [],
    };
};

export const getClients = async (): Promise<Client[]> => {
    const snapshot = await getDocs(clientsCollection);
    return snapshot.docs.map(toClientObject);
};

export const addClient = async (clientData: Omit<Client, 'id'>): Promise<Client> => {
    const docRef = await addDoc(clientsCollection, clientData);
    return { id: docRef.id, ...clientData };
};

export const updateClient = async (id: string, clientData: Partial<Client>): Promise<void> => {
    const clientDoc = doc(db, 'clients', id);
    await updateDoc(clientDoc, clientData);
};

export const deleteClient = async (id: string): Promise<void> => {
    const clientDoc = doc(db, 'clients', id);
    await deleteDoc(clientDoc);
};
