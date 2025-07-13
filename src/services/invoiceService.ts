import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import type { Invoice } from '@/types';

const invoicesCollection = collection(db, 'invoices');

const toInvoiceObject = (doc: any): Invoice => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
        dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate().toISOString() : data.dueDate,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
    };
};

export const getInvoices = async (): Promise<Invoice[]> => {
    const snapshot = await getDocs(invoicesCollection);
    return snapshot.docs.map(toInvoiceObject);
};

export const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'> & { invoiceNumber: string, createdAt: string }): Promise<Invoice> => {
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
