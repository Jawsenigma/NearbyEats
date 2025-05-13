// hooks/useCurrentLocation.ts
import * as Location from 'expo-location'
import { useEffect, useState } from 'react'

export interface UserLocation {
  latitude: number
  longitude: number
}

export default function useCurrentLocation(): {
  location: UserLocation | null
  errorMsg: string | null
} {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setErrorMsg('Location permission denied.')
        return
      }
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      })
      setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
    })()
  }, [])

  return { location, errorMsg }
}
