import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, onSnapshot, setDoc, updateDoc, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface DaySchedule {
  enabled: boolean;
  start: string; // HH:mm
  end: string;   // HH:mm
  maxPatients?: number; // maximum patients for the day within the window
}

export interface ExceptionDay {
  date: string; // YYYY-MM-DD
  closed: boolean;
  start?: string; // HH:mm
  end?: string;   // HH:mm
}

export interface DoctorSchedule {
  weekly: { [day: string]: DaySchedule };
  exceptions: ExceptionDay[];
  timezone?: string;
  slotMinutes?: number; // duration of each appointment slot in minutes
  updatedAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  constructor(private firestore: Firestore) {}

  private docRef(doctorId: string) {
    return doc(this.firestore, 'schedules', doctorId);
  }

  getSchedule(doctorId: string): Observable<DoctorSchedule | null> {
    const ref = this.docRef(doctorId);
    return new Observable(observer => {
      const unsub = onSnapshot(ref, snap => {
        if (snap.exists()) {
          const data = snap.data() as any;
          observer.next({
            ...data,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
          } as DoctorSchedule);
        } else {
          observer.next(null);
        }
      }, err => observer.error(err));
      return unsub;
    });
  }

  async saveSchedule(doctorId: string, schedule: DoctorSchedule): Promise<void> {
    const ref = this.docRef(doctorId);
    const payload = {
      ...schedule,
      updatedAt: Timestamp.now()
    } as any;
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, payload);
    }
  }
}
