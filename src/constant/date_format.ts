// 标准单位
export const Const_Unit_Year = 'year' as const
export const Const_Unit_Month = 'month' as const
export const Const_Unit_Day = 'day' as const
export const Const_Unit_Hour = 'hour' as const
export const Const_Unit_Minute = 'minute' as const
export const Const_Unit_Second = 'second' as const
export const Const_Unit_Millsecond = 'millsecond' as const

// SQL相关
export const Const_Sql_Group_By_Year = '%Y' as const
export const Const_Sql_Group_By_Month = '%Y-%m' as const
export const Const_Sql_Group_By_Day = '%Y-%m-%d' as const
export const Const_Sql_Group_By_Hour = '%Y-%m-%d %H' as const
export const Const_Sql_Group_By_Minute = '%Y-%m-%d %H:%i' as const
export const Const_Sql_Group_By_Second = '%Y-%m-%d %H:%i:%s' as const
export const Const_Sql_Group_By_Millsecond = '%Y-%m-%d %H:%i:%s.%f' as const

export const Const_Sql_By_Unit = {
  [Const_Unit_Year]: Const_Sql_Group_By_Year,
  [Const_Unit_Month]: Const_Sql_Group_By_Month,
  [Const_Unit_Day]: Const_Sql_Group_By_Day,
  [Const_Unit_Hour]: Const_Sql_Group_By_Hour,
  [Const_Unit_Minute]: Const_Sql_Group_By_Minute,
  [Const_Unit_Second]: Const_Sql_Group_By_Second,
  [Const_Unit_Millsecond]: Const_Sql_Group_By_Millsecond,
}

// 数据库相关
export const Const_Database_By_Year = 'YYYY' as const
export const Const_Database_By_Month = 'YYYY-MM' as const
export const Const_Database_By_Day = 'YYYY-MM-DD' as const
export const Const_Database_By_Hour = 'YYYY-MM-DD_HH' as const
export const Const_Database_By_Minute = 'YYYY-MM-DD_HH:mm' as const
export const Const_Database_By_Second = 'YYYY-MM-DD_HH:mm:ss' as const
export const Const_Database_By_Millsecond = 'YYYY-MM-DD_HH:mm:ss.SSS' as const

export const Const_Database_By_Unit = {
  [Const_Unit_Year]: Const_Database_By_Year,
  [Const_Unit_Month]: Const_Database_By_Month,
  [Const_Unit_Day]: Const_Database_By_Day,
  [Const_Unit_Hour]: Const_Database_By_Hour,
  [Const_Unit_Minute]: Const_Database_By_Minute,
  [Const_Unit_Second]: Const_Database_By_Second,
  [Const_Unit_Millsecond]: Const_Database_By_Millsecond,
}

// 展示相关
export const Const_Display_By_Year = 'YYYY' as const
export const Const_Display_By_Month = 'YYYY-MM' as const
export const Const_Display_By_Day = 'YYYY-MM-DD' as const
export const Const_Display_By_Hour = 'YYYY-MM-DD HH' as const
export const Const_Display_By_Minute = 'YYYY-MM-DD HH_mm' as const
export const Const_Display_By_Second = 'YYYY-MM-DD HH_mm_ss' as const
export const Const_Display_By_Millsecond = 'YYYY-MM-DD HH_mm_ss.SSS' as const

export const Const_Display_By_Unit = {
  [Const_Unit_Year]: Const_Display_By_Year,
  [Const_Unit_Month]: Const_Display_By_Month,
  [Const_Unit_Day]: Const_Display_By_Day,
  [Const_Unit_Hour]: Const_Display_By_Hour,
  [Const_Unit_Minute]: Const_Display_By_Minute,
  [Const_Unit_Second]: Const_Display_By_Second,
  [Const_Unit_Millsecond]: Const_Display_By_Millsecond,
}

// 命令行相关
export const Const_Command_Argument_By_Year = 'YYYY' as const
export const Const_Command_Argument_By_Month = 'YYYY-MM' as const
export const Const_Command_Argument_By_Day = 'YYYY-MM-DD' as const
export const Const_Command_Argument_By_Hour = 'YYYY-MM-DD HH' as const
export const Const_Command_Argument_By_Minute = 'YYYY-MM-DD HH:mm' as const
export const Const_Command_Argument_By_Second = 'YYYY-MM-DD HH:mm:ss' as const
export const Const_Command_Argument_By_Millsecond = 'YYYY-MM-DD HH:mm:ss.SSS' as const

export const Const_Command_Argument_By_Unit = {
  [Const_Unit_Year]: Const_Command_Argument_By_Year,
  [Const_Unit_Month]: Const_Command_Argument_By_Month,
  [Const_Unit_Day]: Const_Command_Argument_By_Day,
  [Const_Unit_Hour]: Const_Command_Argument_By_Hour,
  [Const_Unit_Minute]: Const_Command_Argument_By_Minute,
  [Const_Unit_Second]: Const_Command_Argument_By_Second,
  [Const_Unit_Millsecond]: Const_Command_Argument_By_Millsecond,
}
