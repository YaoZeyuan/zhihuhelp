import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Author {
  @Column()
  id!: string

  @Column()
  url_token!: string

  @Column()
  raw_json!: string
}
