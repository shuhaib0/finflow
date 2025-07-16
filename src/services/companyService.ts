
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, addDoc } from 'firebase/firestore';
import type { Company } from '@/types';

const companiesCollection = collection(db, 'companies');

const toCompanyObject = (doc: any): Company => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
    };
};

export const getCompanyDetails = async (userId: string): Promise<Company | null> => {
    const q = query(companiesCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    return toCompanyObject(snapshot.docs[0]);
};

export const updateCompanyDetails = async (companyId: string, data: Partial<Omit<Company, 'id' | 'userId'>>): Promise<void> => {
    const companyDoc = doc(db, 'companies', companyId);
    await updateDoc(companyDoc, data);
};

export const createCompanyDetails = async (data: Omit<Company, 'id'>): Promise<Company> => {
    const docRef = await addDoc(companiesCollection, data);
    return {
        id: docRef.id,
        ...data
    };
};
