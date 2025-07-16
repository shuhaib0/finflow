
import { db } from '@/lib/firebase/client';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp, query, where, getCountFromServer } from 'firebase/firestore';
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

export const getQuotations = async (userId: string): Promise<Quotation[]> => {
    const q = query(quotationsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toQuotationObject).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getQuotationCount = async (userId: string): Promise<number> => {
    const q = query(quotationsCollection, where("userId", "==", userId));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
}

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
