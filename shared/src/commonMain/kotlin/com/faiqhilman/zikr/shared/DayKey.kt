package com.faiqhilman.zikr.shared

import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.atStartOfDayIn
import kotlinx.datetime.toLocalDateTime

object DayKey {
    fun string(
        date: Instant,
        timeZone: TimeZone = TimeZone.currentSystemDefault()
    ): String {
        val localDate = date.toLocalDateTime(timeZone).date
        return "${localDate.year}-${localDate.monthNumber.toString().padStart(2, '0')}-${localDate.dayOfMonth.toString().padStart(2, '0')}"
    }

    fun date(
        key: String,
        timeZone: TimeZone = TimeZone.currentSystemDefault()
    ): Instant? {
        val values = key.split("-").mapNotNull { it.toIntOrNull() }
        if (values.size != 3) return null
        return runCatching {
            LocalDate(values[0], values[1], values[2]).atStartOfDayIn(timeZone)
        }.getOrNull()
    }

    fun dayDifference(
        lhs: String,
        rhs: String,
        timeZone: TimeZone = TimeZone.currentSystemDefault()
    ): Int? {
        val start = date(lhs, timeZone)?.toLocalDateTime(timeZone)?.date ?: return null
        val end = date(rhs, timeZone)?.toLocalDateTime(timeZone)?.date ?: return null
        return end.toEpochDays() - start.toEpochDays()
    }

    fun startOfDay(
        instant: Instant,
        timeZone: TimeZone = TimeZone.currentSystemDefault()
    ): Instant = instant.toLocalDateTime(timeZone).date.atStartOfDayIn(timeZone)
}

private fun LocalDate.toEpochDays(): Int {
    val epoch = LocalDate(1970, 1, 1).atStartOfDayIn(TimeZone.UTC)
    val thisStart = atStartOfDayIn(TimeZone.UTC)
    return ((thisStart - epoch).inWholeDays).toInt()
}
