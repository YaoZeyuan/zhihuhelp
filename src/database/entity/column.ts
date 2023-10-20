import { Column as DbColumn, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Column {
  @DbColumn("varchar", { nullable: false })
  column_id!: string

  @DbColumn("text", { nullable: false })
  raw_json!: string
}
