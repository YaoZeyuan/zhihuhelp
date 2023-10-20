import { Column as DbColumn, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class Column {
  @PrimaryColumn("varchar", { nullable: false })
  column_id!: string

  @DbColumn("text", { nullable: false })
  raw_json!: string
}
