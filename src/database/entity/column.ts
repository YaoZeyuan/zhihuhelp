import { Column as DbColumn, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Column {
  @DbColumn()
  column_id!: string

  @DbColumn()
  raw_json!: string
}
