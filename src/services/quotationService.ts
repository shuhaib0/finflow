
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import type { Quotation } from '@/types';

const quotationsCollection = collection(db, 'quotations');

const toQuotationObject = (doc: any): Quotation => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        date: data.date?.toDate ? data.date.toDate().toISOString() : data.date,
        dueDate: data.dueDate?.toDate ? data.dueDate.toDate().toISOString() : data.dueDate,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    };
};

export const getQuotations = async (): Promise<Quotation[]> => {
    const snapshot = await getDocs(quotationsCollection);
    return snapshot.docs.map(toQuotationObject);
};

export const addQuotation = async (quotationData: Omit<Quotation, 'id'>): Promise<Quotation> => {
    const dataWithTimestamps = {
        ...quotationData,
        date: Timestamp.fromDate(new Date(quotationData.date)),
        dueDate: Timestamp.fromDate(new Date(quotationData.dueDate)),
        createdAt: Timestamp.fromDate(new Date(quotationData.createdAt)),
    };
    const docRef = await addDoc(quotationsCollection, dataWithTimestamps);
    return { ...quotationData, id: docRef.id };
};

export const updateQuotation = async (id: string, quotationData: Partial<Omit<Quotation, 'id'>>): Promise<void> => {
    const quotationDoc = doc(db, 'quotations', id);
    const dataToUpdate: { [key: string]: any } = { ...quotationData };

    if (quotationData.date) {
        dataToUpdate.date = Timestamp.fromDate(new Date(quotationData.date));
    }
    if (quotationData.dueDate) {
        dataToUpdate.dueDate = Timestamp.fromDate(new Date(quotationData.dueDate));
    }

    await updateDoc(quotationDoc, dataToUpdate);
};

export const deleteQuotation = async (id: string): Promise<void> => {
    const quotationDoc = doc(db, 'quotations', id);
    await deleteDoc(quotationDoc);
};
