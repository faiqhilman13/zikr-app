package com.faiqhilman.zikr.android.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColors = lightColorScheme(
    primary = ZikrPalette.royalBlue,
    onPrimary = ZikrPalette.ivory,
    primaryContainer = ZikrPalette.goldPale,
    onPrimaryContainer = ZikrPalette.midnight,
    secondary = ZikrPalette.gold,
    onSecondary = ZikrPalette.midnight,
    secondaryContainer = ZikrPalette.goldPale,
    onSecondaryContainer = ZikrPalette.midnight,
    tertiary = ZikrPalette.greenMid,
    background = ZikrPalette.ivory,
    onBackground = ZikrPalette.midnight,
    surface = Color.White,
    onSurface = ZikrPalette.midnight,
    surfaceVariant = ZikrPalette.ivoryDark,
    onSurfaceVariant = ZikrPalette.royalBlueLight,
    outline = ZikrPalette.ivoryDark,
    outlineVariant = ZikrPalette.ivoryDark,
)

private val DarkColors = darkColorScheme(
    primary = ZikrPalette.goldLight,
    onPrimary = ZikrPalette.deepNavy,
    primaryContainer = ZikrPalette.darkCard,
    onPrimaryContainer = ZikrPalette.lightText,
    secondary = ZikrPalette.gold,
    onSecondary = ZikrPalette.deepNavy,
    secondaryContainer = ZikrPalette.darkCard,
    onSecondaryContainer = ZikrPalette.goldPale,
    tertiary = ZikrPalette.greenLight,
    background = ZikrPalette.deepNavy,
    onBackground = ZikrPalette.lightText,
    surface = ZikrPalette.darkSurface,
    onSurface = ZikrPalette.lightText,
    surfaceVariant = ZikrPalette.darkCard,
    onSurfaceVariant = ZikrPalette.mutedBlue,
    outline = ZikrPalette.darkBorder,
    outlineVariant = ZikrPalette.darkBorder,
)

@Composable
fun ZikrTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColors else LightColors

    val view = LocalView.current
    if (!view.isInEditMode) {
        val activity = view.context as Activity
        SideEffect {
            val window = activity.window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}