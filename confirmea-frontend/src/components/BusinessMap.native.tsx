import React from "react";
import MapView, { Marker } from "react-native-maps";
import { colors } from "../theme/theme";
import type { BusinessWithOffers, Suburb } from "../types";

interface Props {
  businesses: BusinessWithOffers[];
  suburb: Suburb;
  onSelectBusiness: (businessId: number) => void;
}

// Metro picks this file automatically for iOS/Android builds (the ".native.tsx"
// suffix), and picks the plain BusinessMap.tsx instead for web — which never
// imports react-native-maps at all. That split happens at the bundler level, not
// at runtime, which is what actually keeps react-native-maps out of the web
// bundle (a runtime Platform.OS check alone isn't enough — Metro still needs to
// resolve every import in a file it decides to bundle).
export default function BusinessMap({ businesses, suburb, onSelectBusiness }: Props) {
  const plottable = businesses.filter((b) => b.latitude !== null && b.longitude !== null);

  return (
    <MapView
      key={suburb.name}
      style={{ flex: 1 }}
      initialRegion={{
        latitude: suburb.lat,
        longitude: suburb.lng,
        latitudeDelta: 0.09,
        longitudeDelta: 0.09,
      }}
    >
      {plottable.map((business) => (
        <Marker
          key={business.id}
          coordinate={{ latitude: business.latitude!, longitude: business.longitude! }}
          title={business.name}
          description={`${business.category} · ${business.openOffers} offer${
            business.openOffers === 1 ? "" : "s"
          } open`}
          pinColor={colors.apricotDark}
          onCalloutPress={() => onSelectBusiness(business.id)}
        />
      ))}
    </MapView>
  );
}
