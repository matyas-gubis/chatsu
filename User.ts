export class User {
    id: number;
    username: string;
    password: string;
    sessionID: string;
    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }
}