
import Particles from "react-tsparticles";
export default function ParticleBackground() {
  return (
    <Particles
      options={{
        background: { color: "#fdf6ff" },
        particles: { number: { value: 50 }, move: { enable: true } }
      }}
    />
  );
}
