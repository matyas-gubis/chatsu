import { User } from "./User";

export class UserRepository {
    users: Array<User>
    constructor(users: Array<User>) {
        this.users = users;
    }

    addUser(user: User) {
        if (this.users.find(u => u.username === user.username)) {
            throw new Error('user already exists')
        }

        user.id = this.users.length
        this.users.push(user)
    }

    removeUserById(id: number) {
        this.users = this.users.filter(u => u.id !== id)
    }

    removeUserByUsername(username: string) {
        this.users = this.users.filter(u => u.username !== username)
    }

    findUserByUsername(username: string): User {
        return this.users.find(u => u.username === username)
    }

    findUserByID(id: number): User {
        return this.users.find(u => u.id === id)
    }

    length() { return this.users.length }
}