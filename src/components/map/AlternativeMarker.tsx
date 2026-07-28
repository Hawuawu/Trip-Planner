import { useState } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';
import { CheckpointIcon } from '../timeline/CheckpointIcon';
import type { Alternative } from '../../types';

// Wisteria Purple — distinguishes the alternatives layer as a whole from
// checkpoint markers; not per-category (type is still shown via icon).
const ALTERNATIVE_MARKER_COLOR = '#9B59B6';

interface Props {
  alternative: Alternative;
}

export function AlternativeMarker({ alternative }: Props) {
  const [showPopup, setShowPopup] = useState(false);
  if (!alternative.location) return null;

  return (
    <>
      <Marker
        longitude={alternative.location.lng}
        latitude={alternative.location.lat}
        anchor="center"
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          setShowPopup(true);
        }}
      >
        <div
          style={{
            background: '#fff',
            border: `2px solid ${ALTERNATIVE_MARKER_COLOR}`,
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: ALTERNATIVE_MARKER_COLOR,
            cursor: 'pointer',
          }}
        >
          <CheckpointIcon type={alternative.type} style={{ width: 20, height: 20 }} />
        </div>
      </Marker>

      {showPopup && (
        <Popup
          longitude={alternative.location.lng}
          latitude={alternative.location.lat}
          anchor="bottom"
          onClose={() => setShowPopup(false)}
          closeOnClick={false}
        >
          <strong>{alternative.name}</strong>
          {alternative.location.label && (
            <>
              <br />
              {alternative.location.label}
            </>
          )}
        </Popup>
      )}
    </>
  );
}
