
import { db } from '@/lib/firebase/client';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp, query, where, getCountFromServer } from 'firebase/firestore';
import type { Invoice } from '@/types';

const invoicesCollection = collection(db, 'invoices');

const toInvoiceObject = (doc: any): Invoice => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        date: data.date?.toDate ? data.date.toDate().toISOString() : data.date,
        dueDate: data.dueDate?.toDate ? data.dueDate.toDate().toISOString() : data.dueDate,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    };
};

export const getInvoices = async (userId: string): Promise<Invoice[]> => {
    const q = query(invoicesCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toInvoiceObject).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getInvoiceCount = async (userId: string): Promise<number> => {
    const q = query(invoicesCollection, where("userId", "==", userId));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
}

export const addInvoice = async (invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> => {
    const dataWithTimestamps = {
        ...invoiceData,
        date: Timestamp.fromDate(new Date(invoiceData.date)),
        dueDate: Timestamp.fromDate(new Date(invoiceData.dueDate)),
        createdAt: Timestamp.fromDate(new Date(invoiceData.createdAt)),
    };
    const docRef = await addDoc(invoicesCollection, dataWithTimestamps);
    return { ...invoiceData, id: docRef.id };
};

export const updateInvoice = async (id: string, invoiceData: Partial<Omit<Invoice, 'id'>>): Promise<void> => {
    const invoiceDoc = doc(db, 'invoices', id);
    const dataToUpdate: { [key: string]: any } = { ...invoiceData };

    if (invoiceData.date) {
        dataToUpdate.date = Timestamp.fromDate(new Date(invoiceData.date));
    }
    if (invoiceData.dueDate) {
        dataToUpdate.dueDate = Timestamp.fromDate(new Date(invoiceData.dueDate));
    }

    await updateDoc(invoiceDoc, dataToUpdate);
};

export const deleteInvoice = async (id: string): Promise<void> => {
    const invoiceDoc = doc(db, 'invoices', id);
    await deleteDoc(invoiceDoc);
};
