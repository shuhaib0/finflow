
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import type { Transaction } from '@/types';

const transactionsCollection = collection(db, 'transactions');

const toTransactionObject = (doc: any): Transaction => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        date: data.date?.toDate ? data.date.toDate().toISOString() : data.date,
    } as Transaction;
};

export const getTransactions = async (): Promise<Transaction[]> => {
    const snapshot = await getDocs(transactionsCollection);
    return snapshot.docs.map(toTransactionObject);
};

export const addTransaction = async (transactionData: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const dataWithTimestamp = {
        ...transactionData,
        date: Timestamp.fromDate(new Date(transactionData.date)),
    };
    const docRef = await addDoc(transactionsCollection, dataWithTimestamp);
    return { ...transactionData, id: docRef.id };
};

export const updateTransaction = async (id: string, transactionData: Partial<Omit<Transaction, 'id'>>): Promise<void> => {
    const transactionDoc = doc(db, 'transactions', id);
    const dataToUpdate: { [key: string]: any } = { ...transactionData };

    if (transactionData.date) {
        dataToUpdate.date = Timestamp.fromDate(new Date(transactionData.date));
    }

    await updateDoc(transactionDoc, dataToUpdate);
};

export const deleteTransaction = async (id: string): Promise<void> => {
    const transactionDoc = doc(db, 'transactions', id);
    await deleteDoc(transactionDoc);
};
