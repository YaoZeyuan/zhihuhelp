import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Activity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url_token: string;

    @Column()
    verb: string;

    @Column()
    raw_json: string;
}