import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  private apiUrl = 'https://localhost:7082/api/Authentication';

  constructor(private http: HttpClient) { }

  register(userData: any) {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials);
  }

  userProfile(userId: string) {
    return this.http.get<any>(`${this.apiUrl}/user-profile/${userId}`);
  }
}
