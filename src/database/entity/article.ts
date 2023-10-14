import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Answer {
  @Column()
  article_id!: string

  @Column()
  author_url_token!: string

  @Column()
  author_id!: string

  @Column()
  column_id!: number

  @Column()
  raw_json!: string
}
